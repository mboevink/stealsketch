from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
import random
from html import escape
import re
from hashlib import sha256
from json import loads, dumps
json = lambda obj: dumps(obj, ensure_ascii=False, separators=(',', ':')).encode('utf8')
max = [832,750]
Users = {
    "connected":[],
    "info":{}
}
Balls = {
    "orange":[],
    "red":[],
    "blue":[],
    "green":[],
    "purple":[],
    "white":[],
    "ali":[],
    "black":[]
}
#TODO: load this data from somewhere
count = 0
while count <55:
    Balls["orange"].append([15,100, ""])
    Balls["red"].append([100, 100, ""])
    Balls["blue"].append([200, 100, ""])
    Balls["green"].append([350, 100, ""])
    Balls["purple"].append([450, 100, ""])
    Balls["white"].append([550, 100, ""])
    Balls["ali"].append([750, 100, ""])
    Balls["black"].append([650, 100, ""])
    count += 1

chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567890" 
def handleBalls(m):
    x = m["data"]["x"]
    y = m["data"]["y"]
    i = m["item"]
    mObj = re.findall(r"([a-z]+)([0-9]+)", i) 
    Balls[ mObj[0][0] ][ int(mObj[0][1]) ] = [x, y, "freddo"]
    

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))
        self.name = random.choice(chars) + random.choice(chars) + random.choice(chars)
        self.colour = sha256(str(random.randint(123456, 99999999995)).encode('utf-8')).hexdigest()[:6]

    def onOpen(self):
        print("WebSocket connection open.")
        info = {
            'name':self.name,
            'colour':self.colour,
            'has:':[]
        }

        self.sendMessage(json({'type':'start','data':info}))
        self.sendMessage(json({'type':"list", 'data':Users['info']}))
        self.sendMessage(json({'type':"balls", 'data':Balls}))
        if self.name not in Users["connected"]:
            Users["connected"].append(self)
            for u in Users["connected"]:
                u.sendMessage(json({"type":"connect","data":info}))
            Users["info"][self.name] = info

    def onMessage(self, payload, isBinary):
        msgi = loads(payload.decode('utf-8'))
        
        if msgi['type'] == 'msg':
            msg = json({"type":"msg",
                "name": Users['info'][self.name]["name"],
                "data":escape(msgi['data'][:200])})
        
        if msgi['type'] == 'move':
            if msgi['data']['x'] > (max[0] + 30):
                msgi['data']['x'] = msgi['data']['x'] - (max[0] - 450)
            if msgi['data']['y'] > (max[1]):
                msgi['data']['y'] = msgi['data']['y'] - (max[1] - 450)
              
            msg = json({ "type":"move",
                "data":msgi['data'],
                "item":msgi['item']})
            handleBalls(msgi)
        
        for u in Users["connected"]:
            u.sendMessage(msg, isBinary)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))
        for u in Users["connected"]:
            u.sendMessage(json({ "type":"disconnect", "data":Users["info"][self.name]["name"]}))
        try:
            del Users["info"][self.name]
            Users["connected"].remove(self)
        except KeyError:
            pass


if __name__ == '__main__':
    print("STARTED")
    try:
        import asyncio
    except ImportError:
        # Trollius >= 0.3 was renamed
        import trollius as asyncio

    factory = WebSocketServerFactory(u"ws://127.0.0.1:9000")
    factory.protocol = MyServerProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, '0.0.0.0', 9000)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()
        print("Goodbye")
