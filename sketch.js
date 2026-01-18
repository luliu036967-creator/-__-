/* ======================
   全局变量
====================== */

let carX, carY;                    // 玩家位置
let roadOffset = 0;                // 道路滚动
let speed = 0;                     // 当前速度
let speedometer = 0;               // 速度表显示

let lanes = [260, 350, 440];       // 三条车道 X 坐标
const ROAD_LEFT = 190;             // ✅ 赛道左边界（霓虹模式最小左边界）
const ROAD_RIGHT = 510;            // ✅ 赛道右边界（霓虹模式最大右边界）

let obstacles = [];                // 障碍物数组(负面词汇)
let spawnTimer = 0;                // 障碍物生成计时
let positives = [];                // 积极词汇数组(加分道具)
let positiveSpawnTimer = 0;        // 积极词汇生成计时

let hp = 3;                        // 生命值
let invincible = false;            // 是否无敌
let invincibleTimer = 0;           // 无敌计时
let score = 0;                     // 得分
let distance = 0;                  // 行驶距离

let gameState = "start";           // start / play / over
let playState = "ready";           // ready / playing / enterCyber
let gameMode = "normal";           // normal / cyber

let cyberTransition = 0;           // 彩蛋动画进度

let particles = [];                // 菜单粒子
let roadParticles = [];            // 路面粒子效果
let environment = [];              // 环境物体
let timeOfDay = 0;                 // 时间变化
let weather = "sunny";             // 天气
let weatherTimer = 0;              // 天气变化计时

let roadTextures = [];             // 道路纹理

// 指定负面词汇库
let negativeWords = [
  "加班","涨价","流感","失业","内卷","降薪","堵车","催婚","负债","裁员"
];

// 积极词汇库（触碰加分，仅霓虹模式出现）
let positiveWords = ["暴富","健康","中奖","加薪","升职","平安","好运","上岸"];

// 环境词汇
let environmentWords = ["树", "楼", "云", "山"];

/* ======================
   纹理和资源
====================== */

function preload() {
  createRoadTextures();
}

function createRoadTextures() {
  for(let i = 0; i < 3; i++) {
    let tex = createGraphics(200, 200);
    tex.background(30 + i * 8, 50 + i * 8, 90 + i * 8); // 蓝色系纹理
    tex.loadPixels();
    for(let x = 0; x < tex.width; x++) {
      for(let y = 0; y < tex.height; y++) {
        let index = (x + y * tex.width) * 4;
        let noise = random(-10, 10);
        tex.pixels[index] += noise;
        tex.pixels[index + 1] += noise;
        tex.pixels[index + 2] += noise;
      }
    }
    tex.updatePixels();
    roadTextures.push(tex);
  }
}

/* ======================
   初始化
====================== */

function setup() {
  createCanvas(700, 900);
  angleMode(DEGREES);
  resetGame();
  generateEnvironment();
}

function resetGame() {
  carX = lanes[1];
  carY = height - 160;
  obstacles = [];
  positives = [];
  roadParticles = [];
  hp = 3;
  speed = 0;
  speedometer = 0;
  invincible = false;
  playState = "ready";
  gameMode = "normal";
  score = 0;
  distance = 0;
  timeOfDay = 0;
  weather = "sunny";
  weatherTimer = 0;
  generateEnvironment();
  spawnTimer = 0;
  positiveSpawnTimer = 0;
}

/* ======================
   生成环境物体 ✅ 核心修改：环境词X坐标强制避开赛道
====================== */

function generateEnvironment() {
  environment = [];
  // 背景区域划分：左侧（<ROAD_LEFT）、右侧（>ROAD_RIGHT）
  const leftArea = [-200, -100, 50, 150, 180];  // 赛道左侧背景X坐标
  const rightArea = [520, 600, 650, 750, 800]; // 赛道右侧背景X坐标
  const bgAreas = [...leftArea, ...rightArea]; // 合并左右背景区域
  
  for(let i = 0; i < 20; i++) {
    let type = random(['tree', 'building', 'cloud']);
    environment.push({
      // ✅ 只从背景区域选X坐标，彻底避开赛道190-510区间
      x: random(bgAreas),
      y: random(-height, height * 2),
      type: type,
      size: random(30, 100),
      speed: random(0.3, 0.8),
      layer: random(0.5, 1.5),
      word: random(environmentWords)
    });
  }
}

/* ======================
   主循环
====================== */

function draw() {
  if (gameState === "start") {
    drawStartScreen();
    return;
  }

  if (gameState === "over") {
    drawGameOver();
    return;
  }

  updateTimeAndWeather();
  drawEnvironment();
  updateSpeed();
  drawRoad();
  drawEnvironmentObjects();

  if (playState === "enterCyber") {
    updateCyberTransition();
  } else {
    updateObstacles();
    updatePositives();
  }

  handleInvincible();
  drawPlayer();
  movePlayer();
  drawUI();
  updateRoadEffects();

  if (playState === "playing") {
    distance += speed / 10;
    score = int(distance * 10);
  }

  if (playState === "ready" && keyIsDown(UP_ARROW)) {
    playState = "playing";
  }
}

/* ======================
   时间和天气系统
====================== */

function updateTimeAndWeather() {
  timeOfDay = (timeOfDay + 0.1) % 360;
  weatherTimer++;
  if (weatherTimer > 600) {
    weatherTimer = 0;
    let weathers = ['sunny', 'overcast', 'rain'];
    weather = random(weathers);
  }
}

/* ======================
   开始界面 纯蓝色背景
====================== */

function drawStartScreen() {
  background(28, 56, 120); // 固定纯蓝色背景
  spawnParticles();
  updateParticles();

  fill(255, 255, 255, 220);
  textAlign(CENTER, CENTER);
  textSize(48);
  textFont('Arial Black');
  text("文字竞速", width / 2, height / 2 - 80);
  
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = color(0, 150, 255);
  fill(100, 200, 255);
  text("文字竞速", width / 2, height / 2 - 80);
  drawingContext.shadowBlur = 0;
  
  textSize(22);
  textFont('Arial');
  fill(200, 220, 255);
  text("躲避负面词汇，保持前行！", width / 2, height / 2 - 20);
  
  fill(180, 200, 255);
  textSize(18);
  text("← → 键移动", width / 2, height / 2 + 30);
  text("↑ 键加速前进", width / 2, height / 2 + 60);
  text("SPACE 开始游戏", width / 2, height / 2 + 90);
  
  textSize(16);
  fill(150, 180, 255);
  text("提示：在起点按 ↓ 键进入霓虹模式", width / 2, height / 2 + 130);
  
  if (frameCount % 60 < 30) {
    fill(255, 100, 100);
    textSize(20);
    text("按 SPACE 开始", width / 2, height - 100);
  }
}

function spawnParticles() {
  if (particles.length < 120) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-0.8, 0.8),
      vy: random(-2, -4),
      size: random(2, 6),
      color: color(random(100, 200), random(150, 220), 255, random(150, 255)),
      life: random(100, 255)
    });
  }
}

function updateParticles() {
  noStroke();
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    fill(p.color);
    drawingContext.shadowBlur = 8;
    drawingContext.shadowColor = p.color;
    ellipse(p.x, p.y, p.size, p.size);
    drawingContext.shadowBlur = 0;
    
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 2;
    
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/* ======================
   输入控制
====================== */

function keyPressed() {
  if (key === ' ') {
    if (gameState === "start") {
      resetGame();
      gameState = "play";
    } else if (gameState === "over") {
      resetGame();
      gameState = "play";
    }
    return false;
  }

  if (keyCode === ENTER && gameState === "over") {
    resetGame();
    gameState = "play";
  }

  if ( gameState === "play" && playState === "ready" && keyCode === DOWN_ARROW ) {
    playState = "enterCyber";
    cyberTransition = 0;
  }
  
  if ((key === 'r' || key === 'R') && gameState === "over") {
    resetGame();
    gameState = "play";
  }
}
/* ======================
   速度控制
====================== */

function updateSpeed() {
  if (playState !== "playing") {
    speed = 0;
    speedometer = lerp(speedometer, 0, 0.1);
    return;
  }
  
  let targetSpeed = gameMode === "cyber" ? 18 : 12;
  let acceleration = gameMode === "cyber" ? 0.3 : 0.2;
  
  if (keyIsDown(UP_ARROW)) {
    speed = lerp(speed, targetSpeed, acceleration);
  } else {
    speed = lerp(speed, 0, 0.05);
  }
  
  speedometer = lerp(speedometer, speed, 0.1);
}

/* ======================
   环境绘制 纯蓝色，无绿色
====================== */

function drawEnvironment() {
  noStroke();
  if (gameMode === "normal") {
    // 普通模式：全屏纯浅蓝 + 深蓝赛道
    let bgBlue = color(60, 120, 200);
    let roadBlue = color(35, 70, 125);
    fill(bgBlue);
    rect(0, 0, width, height);
    fill(roadBlue);
    rect(200, 0, 300, height);

  } else {
    // 霓虹模式：纯深蓝色背景
    fill(20, 40, 90);
    rect(0,0,width,height);
    fill(10, 25, 60);
    rect(ROAD_LEFT, 0, 320, height); // 用赛道边界常量
    
    // 霓虹光带（蓝色系）
    for (let i = 0; i < 3; i++) {
      let y = (frameCount * 2 + i * 120) % (height + 240) - 120;
      let alpha = map(abs(y - height/2), 0, height/2, 50, 10);
      stroke(80, 150, 255, alpha);
      strokeWeight(2);
      line(0, y, width, y);
    }
    strokeWeight(1);
    
    // 扫描线（浅蓝色）
    stroke(80, 150, 255, 30);
    for(let y = 0; y < height; y += 10) {
      line(ROAD_LEFT, y, ROAD_RIGHT, y); // 用赛道边界常量
    }
  }
  
  // 淡蓝色太阳/月亮
  if (gameMode === "normal") {
    let sunX = map(sin(timeOfDay), -1, 1, 100, width - 100);
    let sunY = map(cos(timeOfDay), -1, 1, 50, height / 2 - 50);
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = color(150, 200, 255, 150);
    fill(180, 220, 255);
    ellipse(sunX, sunY, 40, 40);
    drawingContext.shadowBlur = 0;
  }
  
  // 浅蓝色雨线
  if (weather === 'rain' && gameMode === "normal") {
    for(let i = 0; i < 5; i++) {
      let x = (frameCount * 3 + i * 50) % width;
      let y = (frameCount * 10 + i * 30) % height;
      stroke(150, 180, 255, 100);
      line(x, y, x + 5, y + 20);
    }
  }
}

/* ======================
   绘制环境物体 ✅ 确保环境词始终在背景
====================== */

function drawEnvironmentObjects() {
  for(let obj of environment) {
    push();
    
    // 移动物体（超出屏幕后重置到背景区域）
    obj.y += speed * obj.speed;
    if (obj.y > height + 100) {
      obj.y = -100;
      // ✅ 重置时仍选择背景区域X坐标，避免跑到赛道上
      const leftArea = [-200, -100, 50, 150, 180];
      const rightArea = [520, 600, 650, 750, 800];
      obj.x = random([...leftArea, ...rightArea]);
      obj.word = random(environmentWords);
    }
    
    // 透视缩放
    let scaleFactor = map(obj.y, -100, height, 0.3, 1.5);
    scaleFactor = constrain(scaleFactor, 0.3, 1.5);
    
    translate(obj.x, obj.y);
    scale(scaleFactor);
    textAlign(CENTER, CENTER);
    
    // 蓝色系环境文字 + 低透明度
    if (obj.type === 'tree') {
      fill(gameMode === "cyber" ? color(60, 180, 255, 120) : color(40, 90, 160, 150));
      textSize(40 * scaleFactor);
      text(obj.word, 0, 0);
    } else if (obj.type === 'building') {
      fill(gameMode === "cyber" ? color(120, 80, 255, 100) : color(60, 60, 120, 120));
      textSize(50 * scaleFactor);
      text(obj.word, 0, 0);
    } else if (obj.type === 'cloud') {
      fill(gameMode === "cyber" ? color(150, 180, 255, 150) : color(180, 200, 240, 180));
      textSize(35 * scaleFactor);
      text(obj.word, 0, 0);
    }
    pop();
  }
}

/* ======================
   道路绘制
====================== */

function drawRoad() {
  roadOffset = (roadOffset + speed) % 40;
  let texIndex = int((frameCount / 10) % roadTextures.length);
  if (gameMode === "normal") {
    drawingContext.shadowBlur = 0;
    image(roadTextures[texIndex], 200, 0, 300, height, 0, roadOffset, roadTextures[texIndex].width, roadTextures[texIndex].height);
  }
  
  // 车道线
  for (let y = -40; y < height; y += 40) {
    if (gameMode === "cyber") {
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(80, 200, 255);
      fill(80, 200, 255);
      rect(width / 2 - 8, y + roadOffset, 16, 25, 3);
      drawingContext.shadowBlur = 0;
    } else {
      fill(230, 240, 255);
      noStroke();
      rect(width / 2 - 6, y + roadOffset, 12, 25);
      if (speed > 5 && y + roadOffset > carY - 100 && y + roadOffset < carY + 100) {
        fill(255, 255, 255, 100);
        rect(width / 2 - 4, y + roadOffset, 8, 25);
      }
    }
  }
  
  if (gameMode === "normal") {
    // 蓝色路肩
    fill(50, 90, 150);
    rect(190, 0, 10, height);
    fill(40, 80, 130);
    rect(200, 0, 5, height);
    fill(50, 90, 150);
    rect(510, 0, 10, height);
    fill(40, 80, 130);
    rect(505, 0, 5, height);
    
    // 路肩标记
    stroke(230,240,255);
    strokeWeight(2);
    for(let y = -30; y < height; y += 60) {
      line(195, y + roadOffset * 0.8, 195, y + roadOffset * 0.8 + 30);
      line(515, y + roadOffset * 0.8, 515, y + roadOffset * 0.8 + 30);
    }
    noStroke();
  }
}

/* ======================
   玩家 - 文字"我"
====================== */

function drawPlayer() {
  if (invincible && frameCount % 8 < 4) return;
  
  push();
  translate(carX, carY);
  textAlign(CENTER, CENTER);
  textSize(60);
  
  if (gameMode === "cyber") {
    drawingContext.shadowBlur = 25;
    drawingContext.shadowColor = color(255, 0, 255, 200);
    fill(255, 0, 255);
    text("我", 0, 0);
    let pulse = sin(frameCount * 5) * 30;
    drawingContext.shadowBlur = 15 + pulse / 3;
    drawingContext.shadowColor = color(80, 200, 255, 150);
    fill(80, 200, 255, 100 + pulse);
    text("我", 0, 0);
  } else {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = color(0, 0, 0, 100);
    let gradient = drawingContext.createLinearGradient(-30, -30, 30, 30);
    gradient.addColorStop(0, 'rgb(255, 100, 100)');
    gradient.addColorStop(0.5, 'rgb(255, 200, 100)');
    gradient.addColorStop(1, 'rgb(255, 150, 100)');
    drawingContext.fillStyle = gradient;
    text("我", 0, 0);
  }
  
  drawingContext.shadowBlur = 0;
  
  if (speed > 8) {
    drawingContext.shadowBlur = 20;
    drawingContext.shadowColor = gameMode === "cyber" ? color(255, 0, 255, 100) : color(220, 40, 40, 100);
    for(let i = 0; i < 3; i++) {
      let len = map(speed, 8, 20, 20, 80) + i * 10;
      stroke(gameMode === "cyber" ? color(255, 0, 255, 100 - i*30) : color(220, 40, 40, 100 - i*30));
      strokeWeight(3 - i);
      line(0, 40, 0, 40 + len);
    }
    noStroke();
    drawingContext.shadowBlur = 0;
  }
  pop();
}

function movePlayer() {
  let moveSpeed = gameMode === "cyber" ? 9 : 7;
  if (keyIsDown(LEFT_ARROW)) carX -= moveSpeed;
  if (keyIsDown(RIGHT_ARROW)) carX += moveSpeed;
  carX = constrain(carX, lanes[0], lanes[2]);
}

/* ======================
   障碍物系统 - 负面词汇
====================== */

function updateObstacles() {
  spawnTimer++;
  let rate = gameMode === "cyber" ? 45 : 70;
  if (spawnTimer > rate && speed > 0) {
    spawnObstacle();
    spawnTimer = 0;
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];
    o.y += speed + o.spd;
    let chance = gameMode === "cyber" ? 0.03 : 0.01;
    if (!o.changing && random() < chance) {
      let dir = random([-1, 1]);
      let target = constrain(o.lane + dir, 0, lanes.length - 1);
      if (target !== o.lane) {
        o.targetLane = target;
        o.changing = true;
        o.progress = 0;
      }
    }
    if (o.changing) {
      o.progress += 0.06;
      o.x = lerp(lanes[o.lane], lanes[o.targetLane], o.progress);
      if (o.progress >= 1) {
        o.lane = o.targetLane;
        o.changing = false;
      }
    }
    drawObstacle(o);
    if (!invincible && collide(o)) {
      hp--;
      invincible = true;
      invincibleTimer = 60;
      createCollisionParticles(o.x, o.y);
      obstacles.splice(i, 1);
      if (hp <= 0) gameState = "over";
    }
    if (o.y > height + 120) obstacles.splice(i, 1);
  }
}

function spawnObstacle() {
  let lane = floor(random(lanes.length));
  let word = random(negativeWords);
  let colors = gameMode === "cyber" ? [
    color(random(150,255), 80, 255),
    color(255, 80, random(150,255)),
    color(80, random(150,255), 255)
  ] : [
    color(180, 40, 40),
    color(200, 120, 40),
    color(160, 40, 120),
    color(40, 100, 180)
  ];
  
  obstacles.push({
    lane, targetLane: lane, x: lanes[lane], y: -120,
    w:80, h:60, spd: gameMode === "cyber" ? random(2,6) : random(0,3),
    col: random(colors), word: word, changing: false, progress:0, fontSize:48
  });
}

function drawObstacle(o) {
  push();
  translate(o.x, o.y);
  textAlign(CENTER, CENTER);
  if (gameMode === "cyber") {
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = o.col;
    fill(o.col);
    textSize(o.fontSize);
    text(o.word,0,0);
    fill(255,255,255,200);
    textSize(o.fontSize-4);
    text(o.word,0,0);
    drawingContext.shadowBlur=0;
  } else {
    fill(0,0,0,100);
    ellipse(0,0,o.w+20,o.h+10);
    fill(o.col);
    textSize(o.fontSize);
    text(o.word,0,0);
    drawingContext.strokeStyle='rgba(0,0,0,0.3)';
    drawingContext.lineWidth=2;
    drawingContext.strokeText(o.word,0,0);
    fill(255,50,50,100);
    textSize(o.fontSize);
    text(o.word,2,2);
  }
  pop();
}

/* ======================
   积极词汇系统 (仅霓虹模式生效，触碰加分)
====================== */
function updatePositives(){
  if(gameMode !== "cyber" || playState !== "playing") return;
  positiveSpawnTimer++;
  let rate = 60;
  if(positiveSpawnTimer > rate && speed >0){
    spawnPositive();
    positiveSpawnTimer=0;
  }
  for(let i=positives.length-1;i>=0;i--){
    let p=positives[i];
    p.y += speed+p.spd;
    drawPositive(p);
    if(collidePositive(p)){
      score +=500;
      createPositiveParticles(p.x,p.y);
      positives.splice(i,1);
    }
    if(p.y>height+120) positives.splice(i,1);
  }
}
function spawnPositive(){
  let lane=floor(random(lanes.length));
  let word=random(positiveWords);
  positives.push({lane, x:lanes[lane], y:-120, w:80, h:60, spd:random(1,4), col:color(0,255,200), word, fontSize:48});
}
function drawPositive(p){
  push();translate(p.x,p.y);textAlign(CENTER,CENTER);
  drawingContext.shadowBlur=20;drawingContext.shadowColor=color(0,255,200,200);
  fill(p.col);textSize(p.fontSize);text(p.word,0,0);
  fill(255,255,255,220);textSize(p.fontSize-3);text(p.word,0,0);
  drawingContext.shadowBlur=0;pop();
}
function collidePositive(p) {
  let pw=40,ph=40,ow=p.w*0.8,oh=p.h*0.8;
  return abs(carX-p.x)<(pw+ow)/2 && abs(carY-p.y)<(ph+oh)/2;
}

/* ======================
   粒子效果
====================== */
function updateRoadEffects() {
  if (speed>5 && playState==="playing") {
    for(let i=0;i<2;i++) {
      roadParticles.push({x:carX+random(-20,20),y:carY+40,vx:random(-1,1),vy:random(5,10),size:random(2,5),
        color: gameMode==="cyber"?color(80,200,255,100):color(230,240,255,100),life:30});
    }
  }
  for(let i=roadParticles.length-1;i>=0;i--) {
    let p=roadParticles[i];fill(p.color);noStroke();ellipse(p.x,p.y,p.size,p.size);
    p.x+=p.vx;p.y+=p.vy;p.life--;if(p.life<=0) roadParticles.splice(i,1);
  }
}
function createCollisionParticles(x,y) {
  for(let i=0;i<20;i++) roadParticles.push({x,y,vx:random(-5,5),vy:random(-5,5),size:random(3,8),color:color(255,100,100,200),life:random(20,40)});
}
function createPositiveParticles(x,y){
  for(let i=0;i<15;i++) roadParticles.push({x,y,vx:random(-4,4),vy:random(-4,4),size:random(2,6),color:color(0,255,200,200),life:random(25,35)});
}

/* ======================
   彩蛋倒退动画
====================== */
function updateCyberTransition() {
  cyberTransition +=0.02;carY +=4;
  push();translate(width/2,height/2);scale(1+sin(cyberTransition*180)*0.1);translate(-width/2,-height/2);
  fill(0,30);rect(0,0,width,height);
  textAlign(CENTER,CENTER);textSize(60+sin(cyberTransition*360)*20);fill(255,0,255,200);text("我",carX,carY);
  for(let i=0;i<3;i++){
    let a=map(sin(cyberTransition*360+i*120),-1,1,50,150);
    fill(100+i*50,0,255,a);noStroke();ellipse(carX,carY+i*20,100-i*30,100-i*30);
  }
  pop();
  if(cyberTransition>=1){gameMode="cyber";playState="playing";carY=height-160;}
}

/* ======================
   碰撞检测和无敌状态
====================== */
function collide(o) {
  let pw=40,ph=40,ow=o.w*0.8,oh=o.h*0.8;
  return abs(carX-o.x)<(pw+ow)/2 && abs(carY-o.y)<(ph+oh)/2;
}
function handleInvincible() {
  if(invincible){invincibleTimer--;if(invincibleTimer<=0) invincible=false;}
}

/* ======================
   用户界面
====================== */
function drawUI() {
  push();drawingContext.shadowBlur=10;drawingContext.shadowColor=color(0,0,0,100);
  fill(gameMode==="cyber"?color(80,200,255):color(255,60,60));textSize(28);textFont('Arial Black');textAlign(LEFT,TOP);
  text("❤ "+hp,30,30);
  fill(gameMode==="cyber"?color(255,0,255):color(255,200,100));textAlign(RIGHT,TOP);
  text("分数: "+nf(score,6),width-30,30);
  text("距离: "+nf(int(distance),4)+"m",width-30,70);pop();
  
  drawSpeedometer();
  
  if(gameMode==="cyber"){
    push();fill(80,200,255);textAlign(CENTER,TOP);textSize(24);
    drawingContext.shadowBlur=15;drawingContext.shadowColor=color(80,200,255,150);
    text("霓虹模式",width/2,30);pop();
  }
  
  if(playState==="ready"){
    push();fill(255,255,230,sin(frameCount*5)*100+155);textAlign(CENTER,CENTER);textSize(32);
    text("按 ↑ 开始前行",width/2,height/2);pop();
  }
}

function drawSpeedometer() {
  let gx=100,gy=height-100,r=60;push();translate(gx,gy);
  fill(0,0,0,150);stroke(gameMode==="cyber"?color(80,200,255):color(100,100,120));strokeWeight(2);ellipse(0,0,r*2,r*2);
  let ms=gameMode==="cyber"?200:120;
  for(let i=0;i<=240;i+=30){
    let a=map(i,0,240,-120,60);let x1=cos(a)*r,y1=sin(a)*r,x2=cos(a)*(r-10),y2=sin(a)*(r-10);
    stroke(gameMode==="cyber"?color(80,200,255):color(200,200,200));strokeWeight(2);line(x1,y1,x2,y2);
    push();let lx=cos(a)*(r-25),ly=sin(a)*(r-25);translate(lx,ly);rotate(a+90);
    fill(gameMode==="cyber"?color(80,200,255):color(230,240,255));noStroke();textSize(12);textAlign(CENTER,CENTER);
    text(int(map(i,0,240,0,ms)),0,0);pop();
  }
  let sa=map(speedometer,0,ms,-120,60);rotate(sa);stroke(gameMode==="cyber"?color(255,0,255):color(255,50,50));strokeWeight(3);line(0,0,r-15,0);
  fill(gameMode==="cyber"?color(255,0,255):color(255,100,100));noStroke();ellipse(0,0,10,10);pop();
  fill(gameMode==="cyber"?color(80,200,255):color(230,240,255));noStroke();textSize(24);textAlign(CENTER,CENTER);
  text(int(speedometer)+" km/h",gx,gy+r+30);
}

/* ======================
   游戏结束画面 纯蓝色背景
====================== */
function drawGameOver() {
  background(28, 56, 120, 200);
  fill(0,0,0,200);rect(0,0,width,height);
  push();translate(width/2,height/2-50);
  drawingContext.shadowBlur=30;drawingContext.shadowColor=color(255,50,50);
  fill(255,100,100);textAlign(CENTER,CENTER);textSize(48);textFont('Arial Black');text("游戏结束",0,0);
  drawingContext.shadowBlur=0;
  fill(255,200,100);textSize(36);text("最终分数: "+score,0,60);
  textSize(28);text("行驶距离: "+int(distance)+"米",0,110);
  fill(150,200,255);textSize(22);text("避开了 "+int(score/100)+" 个负面词汇",0,160);
  fill(150,200,255);textSize(22);
  if(frameCount%60<30) text("按 R 键重新开始",0,210);pop();
}