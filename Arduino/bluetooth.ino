#include <ArduinoBLE.h>
#include <Arduino_LSM9DS1.h>

float acceleration[3];
float gyroscope[3];
float calc_gyroscope[3];
float gyroBiasInput[3];
float gyroBias[3];

BLEService imuService("19B10010-E8F2-537E-4F6C-D104768A1214");

// create switch characteristic and allow remote device to read and write
BLECharacteristic accelerationCharacteristic ("19B10010-E8F2-537E-4F6C-D104768A1214", BLENotify, sizeof(float) * 3, true);
BLECharacteristic gyroscopeCharacteristic    ("19B10011-E8F2-537E-4F6C-D104768A1214", BLENotify, sizeof(float) * 3, true);
//BLECharacteristic gyroBiasCharacteristic    ("19B10012-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite, sizeof(char)*40, true);
BLECharacteristic gyroBiasesCharacteristic    ("19B10013-E8F2-537E-4F6C-D104768A1214", BLENotify| BLERead | BLEWrite, sizeof(float) * 3, true);

void setup() {
  while (!IMU.begin()) {
    Serial.println("Failed to initialize IMU!");
    delay(500);
  }

  IMU.setContinuousMode();
  
  Serial.begin(9600);
  //while (!Serial);

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }

  // set the local name peripheral advertises
  BLE.setLocalName("ArduinoIMU");
  BLE.setDeviceName("ArduinoIMU");
  // set the UUID for the service this peripheral advertises:
  BLE.setAdvertisedService(imuService);

  // add the characteristics to the service
  imuService.addCharacteristic(accelerationCharacteristic); 
  imuService.addCharacteristic(gyroscopeCharacteristic);
  //imuService.addCharacteristic(gyroBiasCharacteristic);
  imuService.addCharacteristic(gyroBiasesCharacteristic);
  
  // add the service
  BLE.addService(imuService);
  gyroBiasesCharacteristic.writeValue(gyroBiasInput, sizeof(gyroBiasInput));
  //ledCharacteristic.writeValue(0);
  //buttonCharacteristic.writeValue(0);

  // start advertising
  BLE.advertise();
  Serial.println(gyroBiasesCharacteristic.valueSize());
  Serial.println(sizeof(gyroBias));
  Serial.println("Bluetooth device active, waiting for connections...");
}

void loop() {
  // poll for BLE events
  BLE.poll();

  if (IMU.gyroscopeAvailable()) {
    IMU.readGyroscope(gyroscope[0], gyroscope[1], gyroscope[2]);
    //calc_gyroscope[0] = gyroscope[0];
    //calc_gyroscope[1] = gyroscope[1];
    //calc_gyroscope[2] = gyroscope[2];
    calc_gyroscope[0] = gyroscope[0] - gyroBias[0]; //바이어스 제거
    calc_gyroscope[1] = gyroscope[1] - gyroBias[1];
    calc_gyroscope[2] = gyroscope[2] - gyroBias[2];
    
    gyroscopeCharacteristic.writeValue(calc_gyroscope, sizeof(calc_gyroscope));
//Serial.println('g');
  }

  if (gyroBiasesCharacteristic.written()){
 
      //gyroBiasCharacteristic.readValue(gyroBiasString, sizeof(char)*36);
      int n = gyroBiasesCharacteristic.readValue(gyroBiasInput, sizeof(gyroBiasInput));
//      gyroBiasX = gyroBiasXCharacteristic.value();
//      gyroBiasXCharacteristic.readValue(gyroBiasY);
      Serial.print(n);
      Serial.print("B ");
      Serial.println(sizeof(gyroBiasInput));
      gyroBias[0] += gyroBiasInput[0];
      gyroBias[1] += gyroBiasInput[1];
      gyroBias[2] += gyroBiasInput[2];
      Serial.println(gyroBias[0]);
      Serial.println(gyroBias[1]);
      Serial.println(gyroBias[2]);
      //Serial.println(gyroBiasesCharacteristic.valueLength());
      //Serial.println(gyroBiasString);
      //
      //Serial.println(gyroBiasCharacteristic.value());
      Serial.println("-B");
      //gyroBiasCharacteristic.readValue(gyroBias, sizeof(float)*3);
    //gyroBiasCharacteristic.readValue(gyroBiasString)
    }
}
 //  if(gyroBiasCharacteristic.value()){
//}

















  /*
//BLEByteCharacteristic ledCharacteristic("19B10011-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite);
// create button characteristic and allow remote device to get notifications
//BLEIntCharacteristic buttonCharacteristic("19B10012-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);
//BLECharacteristic gyroBiasCharacteristic    ("19B10010-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite) //, sizeof(float) * 3);
//BLECharacteristic gyroBiasCharacteristic    ("19B10010-E8F2-537E-4F6C-D104768A1214", BLERead | BLEWrite, sizeof(float) * 3);
  //ledService.addCharacteristic(ledCharacteristic);


//  if (IMU.accelerationAvailable()) {
//    IMU.readAcceleration(acceleration[0], acceleration[1], acceleration[2]);
//    accelerationCharacteristic.writeValue(acceleration, sizeof(acceleration));
//    //Serial.print("acceleration : ");
//    //Serial.print('\t');
////    Serial.print(acceleration[0]);
////    Serial.print('\t');
////    Serial.print(acceleration[1]);
////    Serial.print('\t');
////    Serial.println(acceleration[2]);
//Serial.println('a'); 
//  }
      if (IMU.gyroscopeAvailable()) {
        IMU.readGyroscope(gyroscope[0], gyroscope[1], gyroscope[2]);
        calc_gyroscope[0] = gyroscope[0]-2.276574;
        calc_gyroscope[1] = gyroscope[1]+0.4704;
        calc_gyroscope[2] = gyroscope[2]-0.255923;
        gyroscopeCharacteristic.writeValue(calc_gyroscope, sizeof(calc_gyroscope));
        //Serial.print("gyroscope : ");
        //Serial.print('\t');
        Serial.print(calc_gyroscope[0]);
        Serial.print('\t');
        Serial.print(calc_gyroscope[1]);
        Serial.print('\t');
        Serial.println(calc_gyroscope[2]);
      }

    if (IMU.gyroscopeAvailable()) {
        IMU.readGyroscope(gyroscope[0], gyroscope[1], gyroscope[2]);
        gyroscopeCharacteristic.writeValue(gyroscope, sizeof(gyroscope));
        //Serial.print("gyroscope : ");
        //Serial.print('\t');
        Serial.print(gyroscope[0]);
        Serial.print('\t');
        Serial.print(gyroscope[1]);
        Serial.print('\t');
        Serial.println(gyroscope[2]);
            //Serial.print("gyroscope : ");
    //Serial.print('\t');
//    Serial.print(calc_gyroscope[0]);
//    Serial.print('\t');
//    Serial.print(calc_gyroscope[1]);
//    Serial.print('\t');
//    Serial.println(calc_gyroscope[2]);
//    delay(50);
      }
  */
  /*IMU.readAcceleration(x, y, z);
    accelerationCharacteristic.writeValue(acceleration, sizeof(acceleration));
    Serial.print(x);
    Serial.print('\t');
    Serial.print(y);
    Serial.print('\t');
    Serial.println(z);
  
  calculateAccels();
  delay(100);
  Serial.println();
}

if (millis() % 1000 == 0) {

  sensorValue --;
  if (sensorValue < 0) {
    sensorValue = 255;
  }
  Serial.println(sensorValue);
  buttonCharacteristic.writeValue(sensorValue);
  }
*/
/*
   void calculateAccels()
  {

  float xaccel = x;
  float yaccel = y;
  float zaccel = z;
  double calcx = double(xaccel) * xaccel;
  double calcy = double(yaccel) * yaccel;
  double calcz = double(zaccel) * zaccel;
  //unsigned long calcXY = sqrt(calcx+calcy);
  //unsigned long calcXZ = sqrt(calcx+calcz);
  double calcXYZ = sqrt(calcx + calcy + calcz);
  Serial.println(calcXYZ);

  if (calcXYZ < 0.7)
  {
    mov = mov + 1;
    if ((mov % 3) == 0)
    {
      count = count + 1;
      /*for(i=0; i<99; i++)
        {
        arr[i] = sample_count;
        }
      //sample_count = 0;
      Serial.print(count);
    }
  }
  }
*/
