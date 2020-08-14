 //모듈 불러오기
 var express=require('express')
 var csv= require('fast-csv')
 var path=require('path')
 var fs=require('fs')
 var https = require('https')
 var websocket = require('ws')

// SSL key read
var pk = fs.readFileSync('private.pem','utf8')
var cert = fs.readFileSync('public.pem','utf8')

var credentials = {key: pk, cert: cert}


 //익스프레스 객체 생성
var app=express()

//app.listen(8080)


// 루트 경로(/) 파일을 내보낸다.
app.get('/',function(request,response){
	response.sendFile(path.join(__dirname+'/index2.html'))
})
app.get('/index2.html',function(request,response){
	response.sendFile(path.join(__dirname+'/index2.html'))
})
app.get('/Data.html',function(request,response){
	response.sendFile(path.join(__dirname+'/Data.html'))
})
app.get('/arduino_test.html', function(request, response){
	response.sendFile(path.join(__dirname+'/arduino_test.html'))
})
app.get('/BLE_wirte.html', function(request, response){
	response.sendFile(path.join(__dirname+'/arduino_test.html'))
})

app.use('/css',express.static(__dirname+'/css'))
app.use('/fonts',express.static(__dirname+'/fonts'))
app.use('/img',express.static(__dirname+'/img'))
app.use('/js',express.static(__dirname+'/js'))

//////////////////////////////////////////////////////////////////////////
//html로 요청받은 데이터를 넘겨준다. 
app.get('/employee', function(req,res){
	console.log('제조업 근로자')
	res.send("100명")
})

app.get('/employee2', function(req,res){
	console.log('위험 근로자')
	res.send("23명")
})

app.get('/hy', function(req,res){
	console.log('제조업 근로자')
	res.send("안녕하세요 여기는 대전")
})

app.get('/status', function(req,res){
	console.log('Status Check')
	res.send({ 'status': alertLevel, 'count': workCount, 'count10min': workCount10min })
})


////// 아두이노 센서 값 raw 저장//////
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const accelWriter = createCsvWriter({
  path: 'arduino_sensor_accel_raw.csv',
  header: ['time', 'ax', 'ay', 'az'], //, 'gx', 'gy', 'gz'],
  append: true
})

const gyroWriter = createCsvWriter({
  path: 'arduino_sensor_gyro_raw.csv',
  header: ['time', 'gx', 'gy', 'gz', 'pgx', 'pgy', 'pgz', 'cpgx', 'cpgy', 'cpgz', 'maxdata', 'mindata' , 'upperth' , 'lowerth', 'Count'],
  append: true
})

const gyroPitchWriter = createCsvWriter({
  path: 'pitch_arduino_sensor_gyro_raw.csv',
  header: ['time','cpgy','maxdata', 'mindata' , 'upperth' , 'lowerth'],
  append: true
})

//////////////////// temp var for connected websocket instance
var ws1
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({extended: false}))
app.get('/setBias', function(req,res){
	console.log('set Gyro Bias');
	console.log(req.query)
	if (ws1 === undefined) {
		console.log('no connected websocket!')
		res.send("no connected websocket!");
	} else {
		ws1.send(JSON.stringify(req.query));
		res.send("Set Bias Accepted");
	}
})

///////////////////////////////////////////////////////////////////////////

// set https server
//
var httpsServer = https.createServer(credentials, app)

// setup websocket
var wss = new websocket.Server({ server: httpsServer })

let alertLevel = 0;
let workCount = 0;
let workCount10min = 0;

wss.on('connection', function(ws) {
	ws.send('Websocket initiated')
	ws1 = ws
	ws.on("message", function(message){
		message = JSON.parse(message)
    	//console.log(message)
    	if(message.type == 'accel'){
    		accelWriter.writeRecords(message.data)
    	}
    	else if (message.type == 'gyro'){
    		gyroWriter.writeRecords(message.data)
    	}
    	else if (message.type == 'gyroPitch'){
    		//console.log(message.data[0].cpgy)
    		gyroPitchWriter.writeRecords(message.data)
    		var data = [message.data[0].time, message.data[0].cpgy, message.data[0].maxdata, message.data[0].mindata, message.data[0].upperth, message.data[0].lowerth]
    		//console.log(message.data.time)
    		sensordata.push(data)
    		while(sensordata.length>900) {
    			sensordata.shift();
    		}
    	} else if (message.type == 'workAlert') {
    		alertLevel = message.data.alert;
    		workCount = message.data.count;
    		workCount10min = message.data.count10;
    	}
    	ws.on('close', function() {
    		delete ws1
    	})
    })
})

httpsServer.listen(8443)

////////////////////////Pie chart////////////////////////////////////////////

var testdata= [] //testdata 배열 생성
var testdata_i = 0
var stream2 = fs.createReadStream('data.csv') //data.csv파일 일어 변수저장
var csv_stream2 = csv.parse()
                 .on('data', function(data){ //
                 	testdata.push(data) //testdata보내기
                 	//console.log(data) //data 보여주기
                 })
                 .on('end', function(){ 
                   console.log('usage stream: done')
                 })
stream2.pipe(csv_stream2)

app.get('/Piechart', function(req,res){
	//console.log(testdata)
	res.send(testdata[testdata_i])    //배열을 배열안에 넣어서 배열안의 값 하나씩 넣어주기
	testdata_i = (testdata_i + 1) % testdata.length  // testdata배열을 하나씩 증가시키고 이를 길이 만큼 나눠서
													// 배열이 끝나면 다시 0으로 돌아가기 (배열이 끝나면 데이터읽는것이 끝나지 않게)
})

/////////////////line chart////////////////////////////////////////////////////

var start=0; //시작값
app.get('/linechart', function(req,res){
	console.log(testdata2)
	var test1=[]
	var test2=[]
	var test3=[]
	var test4=[]

    for(i=start;i<start+4;i++){       //i가 시작값이 하나씩 증가할때 시작값에서 4개 
    	test1.push(testdata2[i][0])
    	test2.push(testdata2[i][1])
    	test3.push(testdata2[i][2])
    	test4.push(testdata2[i][3])
    }
    start++							//시작값 하나씩 증가
    
    if(start>testdata2.length-4){   //데이터를 4개씩 보여준다고 할때 시작값이 전체 길이-4까지 도달하면 멈춤
    	start=testdata2.length-4 
    }
    console.log(test1)

    var tdata=[]
    tdata.push(test1)  //데이터4개씩 하나의 배열 보여줌
    tdata.push(test2)
    tdata.push(test3)
    tdata.push(test4)
    console.log(tdata)
    res.send(tdata)

})
var testdata2= [] //testdata 배열 생성
var testdata2_i = 0
var stream3 = fs.createReadStream('data.csv') //data.csv파일 일어 변수저장
var csv_stream3 = csv.parse()
                 .on('data', function(data){ //
                 	testdata2.push(data) //testdata보내기
                 	//console.log(data) //data 보여주기
                 })
                 .on('end', function(){ 
                   console.log('usage stream: done')
                 })
stream3.pipe(csv_stream3)



/////////////////Sensor chart////////////////////////

var sensordata= [] //testdata 배열 생성
var sensordata_i = 0
// var stream4 = fs.createReadStream('pitch_arduino_sensor_gyro_raw.csv') //pitch_arduino_sensor_gyro_raw.csv파일 일어 변수저장
// var csv_stream4 = csv.parse()
//                  .on('data', function(data){ //
//                  	sensordata.push(data) //testdata보내기
//                  	//console.log(data) //data 보여주기
//                  })
//                  .on('end', function(){ 
//                    console.log('usage stream: done')
//                  })
// stream4.pipe(csv_stream4)


//var start2=0; //시작값
app.get('/Sensor', function(req,res){
	//console.log(sensordata)
	var s0=[]
	var s1=[]
	var s2=[]
	var s3=[]
	var s4=[]
	var s5=[]

    //for(i=start2;i<start2+150 && i < sensordata.length;i++){       //i가 시작값이 하나씩 증가할때 시작값에서 4개 
    for(i=0;i<sensordata.length;i++) {
    	s0.push(sensordata[i][0])
    	s1.push(sensordata[i][1])
    	s2.push(sensordata[i][2])
    	s3.push(sensordata[i][3])
    	s4.push(sensordata[i][4])
    	s5.push(sensordata[i][5])
    }
    
    //if( s0.length >= 150 ) {
	//    start2 += 20;
    //} 

    var sdata=[]
    sdata.push(s0)  //데이터4개씩 하나의 배열 보여줌
    sdata.push(s1)  //데이터4개씩 하나의 배열 보여줌
    sdata.push(s2)
    sdata.push(s3)
    sdata.push(s4)
    sdata.push(s5)
    console.log(sensordata.length)
    console.log(sdata[0].length)
    res.send(sdata)

})

