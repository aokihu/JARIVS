# Meta.js 说明

# Node-Parse说明

> 位置:libs/node-parse.js

使用:
```
const Node = require('../../libs/node-parse.js')
const meta = require('./meta.js') // 这里的meta是节点的元信息
var node = new Node(meta)
```

## 实例方法

### Node.pub(topic, data)
> 发布一个广播消息,这个消息的主题不经过包装
>
> **topic**:消息主题,比如node/msg
>
> **data**:String类型的数据格式，如果要传输JSON格式的数据，先用JSON.stringify()方法转化

传输String类型数据
```
var node = new Node(meta)
node.pub('test_node/msg', 'hello world')
```

传输JSON类型数据
```
var node = new Node(meta)
node.pub('test_node/msg', JSON.stringify({"msg":"hello world"}))
```

### Node.send(msg, data)
> 节点主动发送消息,这个消息包会经过包装,添加一个节点名称在最前面,节点名称在meta.json中定义
> 节点名称就是nodename字段变量
>
> **msg**:发送的消息主题
>
> **data**: 发送的数据,处理方法跟pub()相同


### Node.usualPub(topic,data)
> 按照心跳频率广播消息
> **topic** 消息主题
> **data**  发送数据

```
var node = new Node(meta)
node.usualPub('cmd/foot/forward', null)
// 每0.1s发送数据包
```

### Node.usualSend(topic, data)
> 按照在meta.js文件中定义的heartRate频率发送消息,作用和heart类似,避免重复定义心跳频率
> 使用方法和send类似,因为都是node主动发送的信息
