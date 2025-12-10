// Canvas Dinazor - app.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const GROUND_Y = HEIGHT - 30;

// Oyuncu (trex) ayarları
const player = {
  x: 80,
  y: GROUND_Y - 40,   // üst-left referans değil, y koordinatı
  w: 40,
  h: 40,
  vy: 0,
  gravity: 0.9,
  jumpForce: -15,
  onGround: true,
  color: "#2b9348"
};

// Engel ayarları
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 1500; // ms
let lastSpawn = 0;
let speed = 4; // engel hızı (zamanla artacak)

let score = 0;
let started = false;
let gameOver = false;
let lastTime = null;

// Başlat / Yeniden başlat
function resetGame() {
  obstacles = [];
  spawnTimer = 0;
  lastSpawn = performance.now();
  spawnInterval = 1500;
  speed = 4;
  score = 0;
  started = false;
  gameOver = false;
  player.y = GROUND_Y - player.h;
  player.vy = 0;
  player.onGround = true;
  restartBtn.classList.add("hidden");
  scoreEl.textContent = "Skor: 0";
  lastTime = null;
  // Tekrar animasyonu başlat
  requestAnimationFrame(loop);
}

// Engel oluştur
function spawnObstacle() {
  // rastgele yükseklik ve genişlik
  const w = 20 + Math.floor(Math.random() * 30); // 20-50
  const h = 30 + Math.floor(Math.random() * 30); // 30-60
  obstacles.push({
    x: WIDTH + 10,
    y: GROUND_Y - h + 2, // küçük yerleştirme düzeltmesi
    w,
    h,
    color: "#6b4f4f"
  });
}

// Çarpışma kontrolü (AABB)
function isColliding(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Kullanıcı etkileşimleri
function jump() {
  if (gameOver) return;
  started = true;
  if (player.onGround) {
    player.vy = player.jumpForce;
    player.onGround = false;
  }
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.key === "ArrowUp") {
    e.preventDefault();
    jump();
  }
  if (e.code === "KeyR" && gameOver) {
    resetGame();
  }
});

canvas.addEventListener("mousedown", () => jump());
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  jump();
}, {passive:false});

restartBtn.addEventListener("click", resetGame);

// Oyun döngüsü
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  // Temizle
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Yer / gökyüzü çizimi (basit)
  // zemini çiz
  ctx.fillStyle = "#e9f5ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // ground line
  ctx.fillStyle = "#6c6c6c";
  ctx.fillRect(0, GROUND_Y, WIDTH, 2);

  // Başladıysa mantığı çalıştır
  if (started && !gameOver) {
    // spawn timer
    spawnTimer += delta;
    if (spawnTimer > spawnInterval) {
      spawnTimer = 0;
      spawnObstacle();
      // zorlaştır: spawn aralığını yavaşça azalt
      spawnInterval = Math.max(700, spawnInterval - 20);
      // hızlanma
      speed += 0.12;
    }

    // oyuncu fiziği
    player.vy += player.gravity * (delta / 16); // delta bağımlı
    player.y += player.vy * (delta / 16);

    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // engelleri hareket ettir
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x -= speed * (delta / 16);

      // geçtiyse skor arttır
      if (!ob.passed && ob.x + ob.w < player.x) {
        ob.passed = true;
        score += 1;
        scoreEl.textContent = "Skor: " + score;
      }

      // eğer ekran dışına çıktıysa sil
      if (ob.x + ob.w < -50) {
        obstacles.splice(i, 1);
      }

      // çarpışma kontrolü
      if (isColliding(player, ob)) {
        gameOver = true;
      }
    }
  } else {
    // henüz başlamadı: player ufak bir idle animasyon yapabilir
  }

  // çizimler
  // oyuncu (basit bir "dino" biçimi)
  // gövde
  ctx.fillStyle = player.color;
  roundRect(ctx, player.x, player.y, player.w, player.h, 4, true, false);
  // göz
  ctx.fillStyle = "#fff";
  ctx.fillRect(player.x + player.w - 18, player.y + 8, 8, 8);
  ctx.fillStyle = "#000";
  ctx.fillRect(player.x + player.w - 14, player.y + 10, 4, 4);

  // engeller
  for (const ob of obstacles) {
    ctx.fillStyle = ob.color;
    roundRect(ctx, ob.x, ob.y, ob.w, ob.h, 4, true, false);
  }

  // oyun bitti ekran
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.fillText("OYUN BİTTİ", WIDTH / 2, HEIGHT / 2 - 10);
    ctx.font = "18px Arial";
    ctx.fillText("Skor: " + score, WIDTH / 2, HEIGHT / 2 + 20);

    restartBtn.classList.remove("hidden");
  }

  // devam et
  if (!gameOver) requestAnimationFrame(loop);
}

// yardımcı: yuvarlak köşeli dikdörtgen
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  if (typeof r === "undefined") r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Başlat
resetGame();
