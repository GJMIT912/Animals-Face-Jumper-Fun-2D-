const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
resize();
window.addEventListener("resize",resize);

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

/* ---------- ASSETS ---------- */
const bg = new Image(); bg.src="images/bg.png";
const bombImg = new Image(); bombImg.src="images/bomb.png";
const gemImg = new Image(); gemImg.src="images/gems1.png";
const healthImg = new Image(); healthImg.src="images/helth1.png";
const shieldImg = new Image(); shieldImg.src="images/shield1.png";

const faces=[];
for(let i=1;i<=9;i++){
  let img=new Image();
  img.src=`images/face${i}.png`;
  faces.push(img);
}

/* ---------- SOUNDS ---------- */
const snd={
 gem:new Audio("sounds/gem.wav"),
 hit:new Audio("sounds/hit.wav"),
 jump:new Audio("sounds/jump.wav"),
 over:new Audio("sounds/over.wav"),
 shield:new Audio("sounds/shield.wav"),
 helth:new Audio("sounds/helth.wav")
};

/* ---------- GAME DATA ---------- */
let state="MENU";
let gravity=0.6;
let lift=-10;
let speed=4;              // base speed
let distance=0;           // 🔥 distance counter for speed increase

let bgX=0;

let bombs=[];
let gems=[];
let skills=[];
let floatingTexts=[];     // 🔥 for +20 text

let scoreGems=Number(localStorage.getItem("gems"))||0;
let hp=50;
let shield=false;
let shieldTimer=0;

let player={
 x:100,
 y:canvas.height/2,
 w:60,h:60,
 vy:0,
 face:Number(localStorage.getItem("face"))||6
};

/* ---------- SHOP DATA ---------- */
const prices=[1000,700,600,550,450,0,350,250,150];
let unlocked=JSON.parse(localStorage.getItem("unlock"))||
[0,0,0,0,0,1,0,0,0];

/* ---------- CONTROLS ---------- */
window.addEventListener("mousedown",jump);
window.addEventListener("touchstart",jump);

function jump(){
 if(state!=="PLAY")return;
 player.vy=lift;
 snd.jump.play();
}

/* ---------- GAME LOOP ---------- */
function loop(){

 // 🔥 speed increase with distance
 if(state==="PLAY"){
   distance++;
   speed = 4 + distance * 0.0008; // smooth increase
 }

 // background scroll
 bgX -= speed/2;
 if(bgX <= -canvas.width) bgX = 0;
 ctx.drawImage(bg,bgX,0,canvas.width,canvas.height);
 ctx.drawImage(bg,bgX+canvas.width,0,canvas.width,canvas.height);

 if(state==="PLAY"){
  updatePlayer();
  spawnBombs();
  spawnGems();
  spawnSkills();
  drawPlayer();
  drawFloatingText();
  drawUI();
 }

 requestAnimationFrame(loop);
}
loop();

/* ---------- PLAYER ---------- */
function updatePlayer(){
 player.vy+=gravity;
 player.y+=player.vy;

 // auto forward
 player.x += speed*0.01;
 if(player.x > canvas.width/3){
   player.x = canvas.width/3;
 }

 // 🔥 frame out = GAME OVER
 if(player.y < 0 || player.y + player.h > canvas.height){
   gameOver();
 }

 if(shield){
  shieldTimer--;
  if(shieldTimer<=0)shield=false;
 }
}

function drawPlayer(){
 ctx.drawImage(faces[player.face-1],player.x,player.y,player.w,player.h);
 if(shield){
  ctx.strokeStyle="white";
  ctx.lineWidth=4;
  ctx.strokeRect(player.x-4,player.y-4,player.w+8,player.h+8);
 }
}

/* ---------- BOMBS ---------- */
let bombTimer=0;
function spawnBombs(){
 bombTimer++;
 if(bombTimer>180){
  bombTimer=0;
  let count=Math.floor(Math.random()*4)+1;
  for(let i=0;i<count;i++){
   bombs.push({
    x:canvas.width+i*90,
    y:[60,canvas.height/2,canvas.height-160][Math.floor(Math.random()*3)],
    w:80,h:80
   });
  }
 }

 bombs.forEach((b,i)=>{
  b.x-=speed;
  ctx.drawImage(bombImg,b.x,b.y,b.w,b.h);

  if(collide(player,b)){
    if(!shield){
     hp-=25;
     snd.hit.play();
     if(hp<=0)gameOver();
    }
    bombs.splice(i,1);
  }
  if(b.x+b.w<0)bombs.splice(i,1);
 });
}

/* ---------- GEMS ---------- */
let gemTimer=0;
function spawnGems(){
 gemTimer++;
 if(gemTimer>360){
  gemTimer=0;
  gems.push({
   x:canvas.width,
   y:Math.random()*(canvas.height-120),
   val:[10,15,20,25][Math.floor(Math.random()*4)]
  });
 }

 gems.forEach((g,i)=>{
  g.x-=speed;
  ctx.drawImage(gemImg,g.x,g.y,50,50);

  if(collide(player,{x:g.x,y:g.y,w:50,h:50})){
    scoreGems+=g.val;
    localStorage.setItem("gems",scoreGems);
    snd.gem.play();

    // 🔥 floating +text
    floatingTexts.push({
      x:g.x,
      y:g.y,
      text:`+${g.val}`,
      life:120
    });

    gems.splice(i,1);
  }
  if(g.x<0)gems.splice(i,1);
 });
}

/* ---------- FLOATING TEXT ---------- */
function drawFloatingText(){
 floatingTexts.forEach((t,i)=>{
   ctx.fillStyle="lime";
   ctx.font="26px Arial";
   ctx.shadowColor="lime";
   ctx.shadowBlur=15;
   ctx.fillText(t.text,t.x,t.y);
   ctx.shadowBlur=0;

   t.y -= 0.5;
   t.life--;
   if(t.life<=0)floatingTexts.splice(i,1);
 });
}

/* ---------- SKILLS ---------- */
let skillTimer=0;
function spawnSkills(){
 skillTimer++;
 if(skillTimer>480){
  skillTimer=0;
  skills.push({
   x:canvas.width,
   y:[70,canvas.height/2,canvas.height-140][Math.floor(Math.random()*3)],
   type:Math.random()<0.5?"shield":"health"
  });
 }

 skills.forEach((s,i)=>{
  s.x-=speed;
  let img=s.type==="shield"?shieldImg:healthImg;
  ctx.drawImage(img,s.x,s.y,55,55);

  if(collide(player,{x:s.x,y:s.y,w:55,h:55})){
   if(s.type==="shield"){
    shield=true;
    shieldTimer=480;
    snd.shield.play();
   }else{
    hp=50;
    snd.helth.play();
   }
   skills.splice(i,1);
  }
  if(s.x<0)skills.splice(i,1);
 });
}

/* ---------- UI ---------- */
function drawUI(){
 // health
 ctx.fillStyle="red";
 ctx.fillRect(20,20,240,22);
 ctx.fillStyle="lime";
 ctx.fillRect(20,20,240*(hp/50),22);

 // 🔥 BIG gem icon
 ctx.drawImage(gemImg,canvas.width-150,10,60,60);
 ctx.fillStyle="white";
 ctx.font="28px Arial";
 ctx.fillText(scoreGems,canvas.width-80,50);
}

/* ---------- COLLISION ---------- */
function collide(a,b){
 return a.x<b.x+b.w &&
 a.x+a.w>b.x &&
 a.y<b.y+b.h &&
 a.y+a.h>b.y;
}

/* ---------- STATES ---------- */
function startGame(){
 document.getElementById("menu").style.display="none";
 state="PLAY";
}
function gameOver(){
 if(state==="OVER")return;
 snd.over.play();
 state="OVER";
 document.getElementById("gameover").style.display="flex";
}
function restart(){ location.reload(); }

/* ---------- SHOP (UNCHANGED) ---------- */
function openShop(){
 state="SHOP";
 document.getElementById("menu").style.display="none";
 document.getElementById("gameover").style.display="none";
 const shop=document.getElementById("shop");
 shop.style.display="flex";
 shop.innerHTML='<div id="closeShop" onclick="closeShop()">❌</div>';

 faces.forEach((f,i)=>{
  let item=document.createElement("div");
  item.className="shopItem";
  item.innerHTML=`<img src="images/face${i+1}.png"><span>${prices[i]} 💎</span>`;
  let btn=document.createElement("button");
  btn.className="buyBtn";

  if(unlocked[i]){
    btn.innerText=(player.face===i+1)?"EQUIPPED":"EQUIP";
    btn.onclick=()=>equip(i);
  }else{
    btn.innerText="BUY";
    btn.onclick=()=>buy(i);
  }

  item.appendChild(btn);
  shop.appendChild(item);
 });
}

function closeShop(){
 document.getElementById("shop").style.display="none";
 document.getElementById("menu").style.display="flex";
 state="MENU";
}

function buy(i){
 if(scoreGems<prices[i]){ popup(); return; }
 scoreGems-=prices[i];
 unlocked[i]=1;
 localStorage.setItem("unlock",JSON.stringify(unlocked));
 localStorage.setItem("gems",scoreGems);
 openShop();
}

function equip(i){
 player.face=i+1;
 localStorage.setItem("face",player.face);
 openShop();
}

function popup(){
 const p=document.getElementById("popup");
 p.style.display="block";
 setTimeout(()=>p.style.display="none",1500);
}