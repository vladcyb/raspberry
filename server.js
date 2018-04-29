var http = require('http').createServer(handler);

var fs = require("fs");
var io = require("socket.io")(http);

var Gpio = require("onoff").Gpio;

var twinkInterval;

var led1 = new Gpio(14, "out"),
    led2 = new Gpio(15, "out"),
    led3 = new Gpio(18, "out");

var tumblers = [
    led1, led2, led3
];

var twinkling = false;
var timeout;

http.listen(8080);

function handler (req, res) {

    fs.readFile(__dirname + "/public/index.html", function(err, data){
        if (err){
            res.writeHead(404, {'Content-Type': 'text/html'});
            return res.end();
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        return res.end();
    });

}

io.on("connection", function (socket){

    socket.emit("updateStatus", twinkling);
    for(var i = 0; i < tumblers.length; ++i){
        socket.emit("updateLeds", i, tumblers[i].readSync());
    }

    function updateLedState(i){
        socket.emit("updateLeds", i, tumblers[i].readSync());
        socket.broadcast.emit("updateLeds", i, tumblers[i].readSync());
    }


    function setLed(i, val){
        tumblers[i].writeSync(val);
        updateLedState(i);
    }

    socket.on("click", function(i, localVal){

        if (twinkling){
            return;
        }

        var currentVal = tumblers[i].readSync();
        if (currentVal === localVal){
            return;
        }
        setLed(i, localVal);

    });
    var prevLed;
    var twinkleInterv = function(i, up, prevLed){

        timeout = setTimeout(function(){
            setLed(i, 1);
            setLed(prevLed, 0);
            prevLed = i;
            if (up){
                i++;
            }else{
                i--;
            }if (i === tumblers.length - 1){
                up = false;
            }else if (i === 0){
                up = true;
            }if (twinkling){
                twinkleInterv(i, up, prevLed);
            }
        }, 100);

    }

    socket.on("twinkle", function(){

        if (twinkling){
            stopTwinkling();
            return;
        }

        twinkling = true;
        socket.broadcast.emit("updateStatus", true);
        socket.emit("updateStatus", true);

        var up = true;
        if(twinkling){
            setAll(0);
            twinkleInterv(0, up, 2);
        }

    });

    function stopTwinkling(){
        clearTimeout(timeout);
        setAll(0);
        twinkling = false;
        socket.broadcast.emit("updateStatus", false);
        socket.emit("updateStatus", false);
    }

    function setAll(val){
        tumblers.forEach((thumbler, i) => {
            setLed(i, val);
        });
    }

    socket.on("allOn", function(){
        twinkling = false;
        socket.broadcast.emit("updateStatus", false);
        socket.emit("updateStatus", false);
        clearTimeout(timeout);
        setAll(1);
    });

    socket.on("allOff", function(){
        twinkling = false;
        socket.broadcast.emit("updateStatus", false);
        socket.emit("updateStatus", false);
        clearTimeout(timeout);
        setAll(0);
    });

});

process.on("SIGINT", function(){
    tumblers.forEach((tumbler) => {
        tumbler.writeSync(0);
    });
    process.exit();
});


console.log("Started");
