var http = require('http').createServer(handler);

var fs = require("fs");
var io = require("socket.io")(http);

var Gpio = require("onoff").Gpio;

var twinkInterval;



var contents = fs.readFileSync(__dirname + '/leds.txt', 'utf8');

var ledsNumbers = contents.toString().split(/(\n*\s+)/).filter( function(e) { return e.trim().length > 0; } );;

var tumblers = [];
ledsNumbers.forEach((led) => {
    tumblers.push(new Gpio(led, "out"));
});


var twinkling = false;
var timeout;
var isSwitchedOn = false;
var port = "80";
http.listen(port);

const { spawn } = require('child_process');
const ip = spawn('hostname', ['-I']);

ip.stdout.on('data', (data) => {
    var data = `${data}`;
    console.log('Open ' + data.trim() + ':' + port + ' in a browser.');
});

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

    socket.emit("updateStatus", twinkling, isSwitchedOn);
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
        }, 10);

    }

    socket.on("twinkle", function(){

        if (twinkling){
            stopTwinkling();
            return;
        }
        isSwitchedOn = false;
        twinkling = true;
        socket.broadcast.emit("updateStatus", twinkling, isSwitchedOn);
        socket.emit("updateStatus", twinkling, isSwitchedOn);

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
        isSwitchedOn = false;
        socket.broadcast.emit("updateStatus", twinkling, isSwitchedOn);
        socket.emit("updateStatus", twinkling, isSwitchedOn);
    }

    function setAll(val){
        tumblers.forEach((thumbler, i) => {
            setLed(i, val);
        });
    }

    socket.on("toogle", function(){
        if(isSwitchedOn){
            switchOff();
        }else{
            switchOn();
        }
    });

    function switchOn(){
        clearTimeout(timeout);
        setAll(1);
        twinkling = false;
        isSwitchedOn = true;
        socket.emit("updateStatus", twinkling, isSwitchedOn);
        socket.broadcast.emit("updateStatus", twinkling, isSwitchedOn);
    }

    function switchOff(){
        clearTimeout(timeout);
        setAll(0);
        twinkling = false;
        isSwitchedOn = false;
        socket.emit("updateStatus", twinkling, isSwitchedOn);
        socket.broadcast.emit("updateStatus", twinkling, isSwitchedOn);
    }

});

process.on("SIGINT", function(){
    tumblers.forEach((tumbler) => {
        tumbler.writeSync(0);
    });
    process.exit();
});
