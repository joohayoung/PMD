// Copyright (c) 2018 p5ble
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

// The serviceUuid must match the serviceUuid of the device you would like to connect
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";
let accelerationCharacteristic;
let gyroscopeCharacteristic;
let gyroBiasCharacteristic;
let ax = 0, ay = 0, az = 0;
let gx = 0, gy = 0, gz = 0;
let myBLE;
let input;

let ogx = 0, ogy = 0, ogz = 0;

var ws = new WebSocket("wss://192.168.0.61:8443")

ws.onmessage = function(event){
  console.log('websocket');
  console.log(event.data);
  // code
  if (gyroscopeCharacteristic === undefined ) {
    console.log('no connected BLE device');
  } else {
    // TODO: event.data message format check!!!!!! 
    var bias = new Float32Array(3);
    biasJson = JSON.parse(event.data);
    bias[0] = Number((biasJson['gx'])).toFixed(2)
    bias[1] = Number((biasJson['gy'])).toFixed(2)
    bias[2] = Number((biasJson['gz'])).toFixed(2)
    //bias[0] = bias[0].toFixed(0)
    //bias[1] = bias[1].toFixed(0)
    //bias[2] = bias[2].toFixed(0)
    console.log(biasJson)
    console.log('bias')
    console.log(bias)

    //myBLE.write(gyroBiasCharacteristic, bias.toString()+'\0')
    //myBLE.write(gyroBiasCharacteristic, '01234567890123456789012345678901234567890')
    //console.log(bias.toString()+'\0')
    //myBLE.write(gyroBiasXCharacteristic, bias)
    gyroBiasCharacteristic.writeValue(bias)
    //myBLE.write(gyroBiasXCharacteristic, '01234567890123456789012345678901234567890')
    console.log(bias[0])
  }
}

function setup() {
  // Create a p5ble class
  myBLE = new p5ble();

  createCanvas(1000, 600);
  background("#FFF");
  textSize(14);


  // Create a 'Connect and Start Notifications' button
  const connectButton = createButton('Connect and Start Notifications');
  connectButton.mousePressed(connectAndStartNotify);
  connectButton.position(100,550)

  //const resetButton =createButton('reset')
  const resetButton = createButton('reset');
    resetButton.mousePressed(reset);
    resetButton.position(570,550)

  const setBiasButton = createButton('set Bias');
    setBiasButton.mousePressed(setBias);
    setBiasButton.position(400,550)

/*
  // Create a text input
  input = createInput();

  // Create a 'Write' button
  const writeButton = createButton('Write');
  writeButton.mousePressed(writeToBle);
*/

}

function setBias() {
  httpRequest = new XMLHttpRequest();

  if(!httpRequest) {
    alert('XMLHTTP 인스턴스를 만들 수가 없어요 ㅠㅠ');
    return false;
  }
  httpRequest.onreadystatechange = alertContents;
  httpRequest.open('GET', 'setBias?gx='+Agx+'&gy='+Agy+'&gz='+Agz);
  httpRequest.send();

}

var httpRequest;


function alertContents() {
  if (httpRequest.readyState === XMLHttpRequest.DONE) {
    if (httpRequest.status === 200) {
      alert(httpRequest.responseText);
    } else {
      alert('request에 뭔가 문제가 있어요.');
    }
  }
}


function reset(){
  Pgx = 0, Pgy = 0, Pgz = 0;
}

function connectAndStartNotify() {
  // Connect to a device by passing the service UUID
  myBLE.connect(serviceUuid, gotCharacteristics);
  // You can also filter devices by name
  // myBLE.connect({
  //   filters: [{
  //     services: [serviceUuid],
  //   }, {
  //     name: 'ArduinoIMU'
  //   }]
  // }, gotCharacteristics)
}

// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
  if (error) console.log('error: ', error);
  else {
    for (let i = 0; i < characteristics.length; i++) {
      switch (i) {
        case 0:
          accelerationCharacteristic = characteristics[i];
          // Set datatype to 'custom', p5.ble.js won't parse the data, will return data as it is.
          myBLE.startNotifications(accelerationCharacteristic, handleAcceleration, 'custom');
          break;
        case 1:
          gyroscopeCharacteristic = characteristics[i];
          myBLE.startNotifications(gyroscopeCharacteristic, handleGyroscope, 'custom');
          break;
        case 2:
          gyroBiasCharacteristic = characteristics[i];
          break;
        default:
          console.log("characteristic doesn't match.");
          console.log(i)
          console.log(characteristics[i])
      }
      // if (i == 0) {
      //   accelerationCharacteristic = characteristics[i];
      //   // Set datatype to 'custom', p5.ble.js won't parse the data, will return data as it is.
      //   myBLE.startNotifications(accelerationCharacteristic, handleAcceleration, 'custom');
      // } else if (i == 1) {
      //   gyroscopeCharacteristic = characteristics[i];
      //   myBLE.startNotifications(gyroscopeCharacteristic, handleGyroscope, 'custom');
      // } else {

      //   console.log("characteristic doesn't match.");
      // }
    }  
  }
}


// A function that will be called once got characteristics
function handleAcceleration(data) {
  t = new Date().getTime()
  ax = data.getFloat32(0, true);
  ay = data.getFloat32(4, true);
  az = data.getFloat32(8, true);

  var accel = {'type': 'accel', 'data': [{'time': t, 'ax': ax, 'ay': ay, 'az': az}]}
  //console.log(JSON.stringify(accel))
  ws.send(JSON.stringify(accel))
  //$.post('/arduino_csv_accel_raw', JSON.stringify(accel))
}

let Agx =0, Agy =0, Agz =0;
let gxCount = 0, gyCount = 0, gzCount= 0;
let totalgx = 0, totalgy = 0, totalgz = 0;
let Pgx = 0, Pgy = 0, Pgz = 0;
let Count = 0;
var LtoH = "LtoH";
var HtoL = "HtoL";
var idle = "idle";
var Nidle = "Nidle";
var state=idle;//, state2;
let decaying = 1;
let maxdata=0, mindata=0;


function cutFixed(val, point) {
  return Math.round(val*Math.pow(10,point))/Math.pow(10,point);
}

function handleGyroscope(data) {
  t = new Date().getTime()
  gx = cutFixed(data.getFloat32(0, true), 2);
  gy = cutFixed(data.getFloat32(4, true), 2);
  gz = cutFixed(data.getFloat32(8, true), 2);
  
  //Average 계산
  ++gxCount;
  totalgx += gx;

  ++gyCount;
  totalgy += gy;
  
  ++gzCount;
  totalgz += gz;
  
  Pgx+=(Math.floor(gx)+ogx)*(1/15)/2;
  Pgy+=(Math.floor(gy)+ogy)*(1/15)/2;
  Pgz+=(Math.floor(gz)+ogy)*(1/15)/2;

  ogx = Math.floor(gx); ogy = Math.floor(gy); ogz = Math.floor(gz);


// Tgx배열 100을 만들어 Pgx값을 넣는다. cPgx는 현재값에서 앞전에 들어온 값인 배열100개의 평균을 뺀다.-그래프가 적분으로 인해 증가하는것을 방지 
  cPgx = Pgx - Tgx.reduce(cumulate) / Tgx.length;
  Tgx.push(Pgx);  
  while(Tgx.length>100) {
    Tgx.shift();
  }
  cPgy = Pgy - Tgy.reduce(cumulate) / Tgx.length;
  Tgy.push(Pgy);  
  while(Tgy.length>100) {
    Tgy.shift();
  }
  cPgz = Pgz - Tgz.reduce(cumulate) / Tgx.length;
  Tgz.push(Pgz);  
  while(Tgz.length>100) {
    Tgz.shift();
  }

  curdata = cPgy;
  maxdata = Math.max(Math.max(maxdata,curdata)-decaying,0);
  mindata = Math.min(Math.min(mindata,curdata)+decaying,0);
  MaxMinDiff = maxdata-mindata;
  upperth = maxdata/2;
  lowerth = mindata/2;
  
  

  //MaxMinDiff가 300이상일때
  if (MaxMinDiff>300){
    if(state==idle){
      state=LtoH;
    }
    if(state==LtoH) {
      if(curdata>upperth) {
        //save time stamp
        state = HtoL;
        timestamp = new Date().getTime();
        console.log(state);
        console.log(timestamp);
      }
    } else if(state==HtoL) {
      if(curdata<lowerth){
        //save time stamp
        state = LtoH;
        //timestamp = new Date().getTime();
        //console.log(state);
        Count = Count+1;
      }
    }
  } else {
    //console.log(state);
    state=idle;
    // set idleCount +1
    // if idleCount > 750 (10 seconds)
    //  call reset();  // which reset Position variables to zeros;
    //  set idleCount = 0; 
  }

  var gyro = {'type': 'gyro', 'data': [{'time': t, 'gx': gx, 'gy': gy, 'gz':gz, 'pgx': Pgx, 'pgy': Pgy, 'pgz':Pgz, 'cpgx':cPgx, 'cpgy':cPgy, 'cpgz':cPgz, 'maxdata':maxdata, 'mindata':mindata, 'upperth':upperth, 'lowerth':lowerth, 'Count':Count}]}
  var gyroPitch={'type': 'gyroPitch', 'data': [{'time': t, 'cpgy':cPgy, 'maxdata':maxdata, 'mindata':mindata, 'upperth':upperth, 'lowerth':lowerth}]}
  //ws.send(JSON.stringify(gyro));
  ws.send(JSON.stringify(gyroPitch));
  //$.post('/arduino_csv_gyro_raw', JSON.stringify(gyro))
}

function handlePitch(data) {

}

//5초 마다 평균 계산용 변수 초기화
function countReset(){
   console.log('gxCount=', gxCount);
   Agx = totalgx/gxCount;
   Agy = totalgy/gyCount;
   Agz = totalgz/gzCount;
   gxCount = 0, gyCount = 0, gzCount = 0;
   totalgx = 0, totalgy = 0, totalgz = 0;

}
setInterval(countReset,5000);

//var changColor;
var CountArray = new Array(0);
setInterval(checkWarning, 60000);

function checkWarning() {
  CountArray.push(Count);
  Count = 0;
  if (CountArray.length > 10) {
    CountArray.shift();
  }

  if (CountArray.reduce(cumulate) > 100) {
    // 10분간 반복 동작 횟수 100회 이상.
    console.log("Too much repeated work");
    var workAlert={'type': 'workAlert', 'data': {'alert': 2, 'count':CountArray[CountArray.length-1], 'count10':CountArray.reduce(cumulate)} }
    ws.send(JSON.stringify(workAlert));
  } else if (CountArray[CountArray.length-1] > 10) {
    console.log("Might be a repeated work");
    setColor("#F08080");
    setTimeout(setColor, 2000, "#FFFFFF");
    var workAlert={'type': 'workAlert', 'data': {'alert': 1, 'count':CountArray[CountArray.length-1], 'count10':CountArray.reduce(cumulate)} }
    ws.send(JSON.stringify(workAlert));
  } else {
    var workAlert={'type': 'workAlert', 'data': {'alert': 0, 'count':CountArray[CountArray.length-1], 'count10':CountArray.reduce(cumulate)} }
    ws.send(JSON.stringify(workAlert));
  }
}


function setColor(color) {
  document.body.style.background = color;
}


//배열 선언, 값 더하기
var Tgx = new Array(0);
var Tgy = new Array(0);
var Tgz = new Array(0);
var cumulate = (sum, value) => (sum+value);
Tgx.push(0.);
Tgy.push(0.);
Tgz.push(0.);


function draw() {
  background(255);
  text(`Acceleration X: `+ax, 50, 50);
  text(`Acceleration Y: `+ay, 50, 100);
  text(`Acceleration Z: `+az, 50, 150);

  text(`Gyroscope X: `+gx, 50, 250);
  text(`Gyroscope Y: `+gy, 50, 300);
  text(`Gyroscope Z: `+gz, 50, 350);

  text(`Average X: `+Agx, 300, 250);
  text(`Average Y: `+Agy, 300, 300);
  text(`Average Z: `+Agz, 300, 350);

  text(`Position X: `+Math.floor(Pgx), 550, 250);
  text(`Position Y: `+Math.floor(Pgy), 550, 300);
  text(`Position Z: `+Math.floor(Pgz), 550, 350);

  text(`Count : `+Count, 750,300);
/*
  text(`Test X: `+Tgx, 800, 250);
  text(`Test Y: `+Tgy, 800, 300);
  text(`Test Z: `+Tgz, 800, 350);
*/
}

/*
function gotCharacteristics(error, characteristics) {
  if (error) console.log('error: ', error);
  console.log('characteristics: ', characteristics);
  // Set the first characteristic as myCharacteristic
  myCharacteristic = characteristics[0];
}

function writeToBle() {
  const inputValue = input.value();
  // Write the value of the input to the myCharacteristic
  myBLE.write(myCharacteristic, inputValue);
}
*/