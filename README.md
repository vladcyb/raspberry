Control LEDs connected to your Raspberry Pi's GPIO from your browser. The device from which you open the page must be connected to the same network as your Raspberry.
<br>
Made using this tutorial: https://www.w3schools.com/nodejs/nodejs_raspberrypi_webserver_websocket.asp.
<br>
https://youtu.be/4lYXZlEJ7o0

Preparations
------------
- Connect LEDs to your Raspberry Pi
- In the `leds.txt` enter GPIO numbers that you've connected to the LEDs

Installing modules
-

```
npm install onoff
npm install socket.io --save
```

Run
---
```
node server
```

In your browser open page `your_raspberry_pi_IP:8080`, where your_raspberry_pi_IP is local IP-address of your Raspberry in the network to which it is connected. You can check it by enter `hostname -I` in your Raspberry Pi's terminal.
