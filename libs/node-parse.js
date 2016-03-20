'use strict'

const _ = require('lodash')
const mqttr = require('mqttr')
const EventEmitter = require("events").EventEmitter
const dgram = require('dgram')
const os = require('os')
const Config = require('../configure.json')

class NodeMeta extends EventEmitter {

  /**
   * 构造函数
  */
  constructor(meta) {
    super();
    this.meta = meta;

    this._find(server => {

      let url = `mqtt://${server.address}:${Config.mosca.port}`
      this.client = mqttr.connect(url,{
        clientId:meta.nodename
      })

      this.client.on('connect', () => this.emit('connect'))

      // subscribe cmd
      meta.CMD = {};
      meta.messages.cmd.forEach(item => {
        this.client.subscribe(`cmd/${meta.nodename}/${item.action}`, (topic, payload, message) => {
          this.emit(item.action, payload) // 触发相关事件
        });

        meta.CMD[item.action] = item.action
      })

    })
  }

  /**
   * 指定定时时间定时发送数据包
   * @param  {Map} packet  发送的数据包
   * @param  {number} rate  定时发送频率，单位hz
   * @return {null}
   */
  usualPub(packet){

    this.packet = packet;

    setInterval(() => {

      let t = this.packet.get('topic')
      let d = this.packet.get('data')

      if(_.isNull(t))
        return 0;
      else{
        _.isNull(d) ? this.pub(t) : this.pub(t, d)
      }

    }, Math.ceil(1000/this.meta.heartRate))

  }

  /**
   * 使用meta中的心率定时发送消息
   * @param  {string} topic 发送主题
   * @param  {string} data 发送的消息
   * @return {}        [description]
   */
  usualSend(packet){

    this.packet = packet;

    setInterval(() => {

      let t = this.packet.get('topic')
      let d = this.packet.get('data')

      if(_.isNull(t))
        return 0;
      else{
        _.isNull(d) ? this.send(t) : this.send(t, d)
      }

    }, Math.ceil(1000/this.meta.heartRate))

  }

  //
  // Publish topic
  //
  pub(topic, data){
    if(data){
      this.client.publish(topic, data)
    }
    else{
      this.client.publish(topic)
    }
  }

  // send data to server
  // this is short 'pub' function
  // add nodename header in topic automatioc
  send(sendMsg, data){
    if(data){
      this.client.publish(this.meta.nodename + '/' + sendMsg, data)
    }
    else {
      this.client.publish(this.meta.nodename + '/' + sendMsg);
    }

  }

  /**
   * 发送命令到指定节点
   * @param  {[type]} toNode [description]
   * @param  {[type]} topic  [description]
   * @param  {[type]} data   [description]
   * @return {[type]}        [description]
   */
  cmd(toNode, topic, data){
    if(data){
      this.pub(`cmd/${toNode}/${topic}`, data);
    }
    else{
      this.pub(`cmd/${toNode}/${topic}`);
    }

  }

  /**
   * 搜寻MQTT服务器
   * @return {[type]} [description]
   */
  _find(cb){
    let server = dgram.createSocket("udp4");
    let timeout = 15000;

    server.bind(Config.discover.pong, () => {
      server.setBroadcast(true);
    	server.setMulticastTTL(128);

      let ifaces = os.networkInterfaces();
      for(let card in ifaces){
        let iface = ifaces[card];
        iface.forEach((node)=>{
          try{
            if(node.family === 'IPv4' && node.internal !== true){
              server.addMembership(Config.discover.group,node.address);
              console.log(`join ${Config.discover.group}@${node.address}`)
            }
          }catch(err){
            console.error(err)
          }
        });
      }
      server.send(new Buffer('hello'),0,5,Config.discover.ping, Config.discover.group,() => {
        console.log('Send hello message')
      })
    })

    server.on('message', (msg, client) => {
      console.log('mqtt',client);
      cb({address:client.address})
      server.dropMembership(Config.discover.group)
      server.close(() => {
        console.log('Discover service closed')
      });
    })

    server.on('listening', () => {
      let address = server.address();
      console.log(`discover server listening ${address.address}:${address.port}`);
    })
  }

}

module.exports = NodeMeta;
