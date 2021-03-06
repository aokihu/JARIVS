# Node
import paho.mqtt.client as mqtt
import json
import socket
import struct
import os

CONFIG_FILE = ''

class Node:

    def __init__(self, meta=None, onConnect=None):
        self.__onConnect = onConnect
        self.__meta = meta
        self.__config = self.__loadConfigure()
        self.__findMQTTServer()
        pass

    def pub(self, topic, payload):
        pass

    def send(self, msg, payload):
        pass

    def usualPub(self, topic, payload):
        pass

    def usualSend(self, msg, payload):
        pass

    def __loadConfigure(self):
        _inputStream = open(os.getcwd()+'/../../configure.json','r')
        _json = _inputStream.read()
        _inputStream.close()

        return json.loads(_json)

    def __handler_on_connect(self, client, userdata, flags, rc):
        print("Connected with result code "+str(rc))
        if self.__onConnect and hasattr(self.__onConnect,'__call__'):
            self.__onConnect()

    def __handler_on_message(self, client, userdata, msg):
        print('userdata', userdata)
        print('msg', msg.topic,msg.payload)

    def __connectMQTT(self, address):
        self.__mqttClient = mqtt.Client()
        self.__mqttClient.on_connect = self.__handler_on_connect
        self.__mqttClient.on_message = self.__handler_on_message
        self.__mqttClient.connect(address[0], self.__config[u'mosca'][u'port'])
        self.__mqttClient.loop_forever()
        pass

    # Search MQTT server
    def __findMQTTServer(self):
        MCAST_GRP = self.__config[u'discover'][u'group']
        MCAST_PORT_PONG = self.__config[u'discover'][u'pong']
        MCAST_PORT_PING = self.__config[u'discover'][u'ping']

        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((MCAST_GRP, MCAST_PORT_PONG))  # use MCAST_GRP instead of '' to listen only
                                     # to MCAST_GRP, not all groups on MCAST_PORT
        mreq = struct.pack("4sl", socket.inet_aton(MCAST_GRP), socket.INADDR_ANY)

        sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

        # send 'hello' message
        sockPing = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
        sockPing.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, 2)
        sockPing.sendto("hello", (MCAST_GRP, MCAST_PORT_PING))

        while True:
            data,addr = sock.recvfrom(1024)
            if data == 'world':
                print(addr)
                sock.close()
                sockPing.close()
                print('Discover server closed')
                self.__connectMQTT(addr)
                break

if __name__  ==  '__main__':
    node = Node()
