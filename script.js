document.addEventListener("DOMContentLoaded", () => {
  /*
     ELEMENTS
   */

  const canvas = document.querySelector("#wheel");
  const spinButton = document.querySelector("#spin-button");
  const winner = document.querySelector("#winner");
  const particleContainer = document.querySelector("#winner-particles");
  const choiceList = document.querySelector("#choice-list");
  const addChoiceButton = document.querySelector("#add-choice");
  const clearChoicesButton = document.querySelector("#clear-choices");
  const choiceCount = document.querySelector("#choice-count");

  if (
    !canvas ||
    !spinButton ||
    !winner ||
    !particleContainer ||
    !choiceList ||
    !addChoiceButton ||
    !clearChoicesButton ||
    !choiceCount
  ) {
    console.error("One or more wheel app elements could not be found.");
    return;
  }

  const ctx = canvas.getContext("2d");

  /* 
     APP SETTINGS
 */

  const MIN_CHOICES = 3;
  const MAX_CHOICES = 12;
  const WHEEL_SIZE = 500;
  const FONT_SIZE = 20;
  const SPIN_DURATION = 4000;
  const FULL_SPINS = 6;
  const GLOW_STRENGTH = 18;
  const TEXT_COLOR = "#ffffff";
  const BORDER_COLOR = "#ff4fd8";
  const HUB_COLOR = "#161622";
  const PARTICLE_AMOUNT = 16;

  const DEFAULT_ITEMS = [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4",
    "Option 5",
    "Option 6"
  ];

  const DEFAULT_COLORS = [
    "#ff5fb7",
    "#7b61ff",
    "#27d7ff",
    "#ff9d45",
    "#65e572",
    "#a76cff",
    "#ff5577",
    "#3ee6c2",
    "#ffd65c",
    "#5f8cff",
    "#d95cff",
    "#ff8f3d"
  ];

  /* 
     STATE
  */

  let items = [...DEFAULT_ITEMS];
  let currentRotation = 0;
  let isSpinning = false;

  canvas.width = WHEEL_SIZE;
  canvas.height = WHEEL_SIZE;

  /* 
     COLOR HELPERS
  */

  function adjustColor(hex, amount) {
    let color = String(hex).replace("#", "");

    if (color.length === 3) {
      color = color
        .split("")
        .map((char) => char + char)
        .join("");
    }

    if (color.length !== 6) {
      return hex;
    }

    const num = parseInt(color, 16);

    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00ff) + amount;
    let b = (num & 0x0000ff) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
    );
  }

  function lightenColor(hex, amount) {
    return adjustColor(hex, amount);
  }

  function darkenColor(hex, amount) {
    return adjustColor(hex, -amount);
  }

  /* 
     CHOICE UI
  */

  function updateChoiceCount() {
    choiceCount.textContent =
      `${items.length} ${items.length === 1 ? "choice" : "choices"}`;

    addChoiceButton.disabled = items.length >= MAX_CHOICES;
  }

  function renderChoiceInputs() {
    choiceList.innerHTML = "";

    items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "choice-row";

      const number = document.createElement("span");
      number.className = "choice-number";
      number.textContent = index + 1;

      const input = document.createElement("input");
      input.className = "choice-input";
      input.type = "text";
      input.value = item;
      input.placeholder = `Option ${index + 1}`;
      input.maxLength = 32;
      input.setAttribute("aria-label", `Choice ${index + 1}`);

      input.addEventListener("input", () => {
        items[index] = input.value.trim() || `Option ${index + 1}`;
        drawWheel();
      });

      input.addEventListener("blur", () => {
        if (!input.value.trim()) {
          input.value = `Option ${index + 1}`;
          items[index] = input.value;
          drawWheel();
        }
      });

      const remove = document.createElement("button");
      remove.className = "remove-choice";
      remove.type = "button";
      remove.innerHTML = "&times;";
      remove.setAttribute("aria-label", `Remove choice ${index + 1}`);

      remove.addEventListener("click", () => {
        if (items.length <= MIN_CHOICES || isSpinning) {
          return;
        }

        items.splice(index, 1);
        renderChoiceInputs();
        drawWheel();
      });

      row.append(number, input, remove);
      choiceList.appendChild(row);
    });

    updateChoiceCount();
  }

  addChoiceButton.addEventListener("click", () => {
    if (items.length >= MAX_CHOICES || isSpinning) {
      return;
    }

    items.push(`Option ${items.length + 1}`);
    renderChoiceInputs();
    drawWheel();

    const inputs = choiceList.querySelectorAll(".choice-input");
    const lastInput = inputs[inputs.length - 1];

    if (lastInput) {
      lastInput.focus();
      lastInput.select();
    }
  });

  clearChoicesButton.addEventListener("click", () => {
    if (isSpinning) {
      return;
    }

    items = [...DEFAULT_ITEMS];
    currentRotation = 0;
    canvas.style.transform = "rotate(0deg)";

    renderChoiceInputs();
    drawWheel();

    winner.innerHTML = `
      <span class="winner-label">Ready when you are</span>
      <strong>Enter your choices and spin!</strong>
    `;
  });

  /*
     TEXT FITTING
 */

  function getFittedFontSize(text, maxWidth, startingSize) {
    let size = startingSize;

    while (size > 10) {
      ctx.font = `700 ${size}px "Ubuntu"`;

      if (ctx.measureText(text).width <= maxWidth) {
        break;
      }

      size -= 1;
    }

    return size;
  }

  /*
     DRAW WHEEL
  */

  function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 22;
    const sliceAngle = (Math.PI * 2) / items.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    items.forEach((item, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const sliceColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.15,
        centerX,
        centerY,
        radius
      );

      gradient.addColorStop(0, lightenColor(sliceColor, 30));
      gradient.addColorStop(0.55, sliceColor);
      gradient.addColorStop(1, darkenColor(sliceColor, 35));

      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.save();
      ctx.strokeStyle = BORDER_COLOR;
      ctx.lineWidth = 2;
      ctx.shadowColor = BORDER_COLOR;
      ctx.shadowBlur = 3;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.20)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + sliceAngle / 2);

      const textAngle =
        (startAngle + sliceAngle / 2) %
        (Math.PI * 2);

      const onLeftSide =
        textAngle > Math.PI / 2 &&
        textAngle < Math.PI * 1.5;

      if (onLeftSide) {
        ctx.rotate(Math.PI);
        ctx.textAlign = "left";
      } else {
        ctx.textAlign = "right";
      }

      ctx.textBaseline = "middle";
      ctx.fillStyle = TEXT_COLOR;
      ctx.shadowColor = "rgba(0,0,0,0.75)";
      ctx.shadowBlur = 4;

      const maxTextWidth = radius * 0.58;

      const fittedSize = getFittedFontSize(
        item,
        maxTextWidth,
        FONT_SIZE
      );

      ctx.font = `700 ${fittedSize}px "Ubuntu"`;

      const textRadius = radius - 34;

      if (onLeftSide) {
        ctx.fillText(
          item,
          -textRadius,
          0,
          maxTextWidth
        );
      } else {
        ctx.fillText(
          item,
          textRadius,
          0,
          maxTextWidth
        );
      }

      ctx.restore();
    });

    /* 
       OUTER RINGS
    */

    ctx.save();

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius + 7,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 6;
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur = GLOW_STRENGTH;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius + 1,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = "#151520";
    ctx.lineWidth = 10;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius - 5,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 3;
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur = GLOW_STRENGTH / 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius - 8,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle = "rgba(255,255,255,0.40)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    /*
       CENTER HUB
    */

    ctx.save();

    const hubRadius =
      Math.max(
        24,
        WHEEL_SIZE * 0.065
      );

    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      hubRadius,
      0,
      Math.PI * 2
    );

    const hubGradient =
      ctx.createRadialGradient(
        centerX - hubRadius * 0.25,
        centerY - hubRadius * 0.25,
        2,
        centerX,
        centerY,
        hubRadius
      );

    hubGradient.addColorStop(
      0,
      lightenColor(HUB_COLOR, 45)
    );

    hubGradient.addColorStop(
      0.55,
      HUB_COLOR
    );

    hubGradient.addColorStop(
      1,
      darkenColor(HUB_COLOR, 25)
    );

    ctx.fillStyle = hubGradient;
    ctx.fill();

    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 5;
    ctx.shadowColor = BORDER_COLOR;
    ctx.shadowBlur = GLOW_STRENGTH;
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      hubRadius * 0.22,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = BORDER_COLOR;
    ctx.fill();

    ctx.restore();
  }

  /* 
     WINNER PARTICLES
 */

  function createWinnerParticles(winningColor) {
    for (let i = 0; i < PARTICLE_AMOUNT; i++) {
      const particle =
        document.createElement("span");

      particle.classList.add(
        "winner-particle"
      );

      particle.textContent = "■";
      particle.style.color = winningColor;

      const size =
        5 + Math.random() * 8;

      particle.style.fontSize =
        `${size}px`;

      particle.style.opacity = "1";

      particle.style.transform =
        "translate(0px, 0px) scale(1)";

      particleContainer.appendChild(
        particle
      );

      const distance =
        WHEEL_SIZE *
        (0.22 + Math.random() * 0.22);

      const angle =
        Math.random() *
        Math.PI *
        2;

      const x =
        Math.cos(angle) *
        distance;

      const y =
        Math.sin(angle) *
        distance;

      setTimeout(() => {
        particle.style.transition =
          "transform 1.1s ease-out, opacity 1.1s ease-out";

        particle.style.transform =
          `translate(${x}px, ${y}px) scale(0.4)`;

        particle.style.opacity = "0";
      }, 80);

      setTimeout(() => {
        particle.remove();
      }, 1300);
    }
  }

  /*
     WINNER RESULT
  */

  function showWinningResult(winnerIndex) {
    const winningText =
      items[winnerIndex];

    const winningColor =
      DEFAULT_COLORS[
        winnerIndex %
        DEFAULT_COLORS.length
      ];

    winner.innerHTML = `
      <span class="winner-label">
        ✦ The wheel chose ✦
      </span>
      <strong>
        ${escapeHTML(winningText)}
      </strong>
    `;

    winner.classList.remove(
      "winner-pop"
    );

    void winner.offsetWidth;

    winner.classList.add(
      "winner-pop"
    );

    createWinnerParticles(
      winningColor
    );
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /*
     SPIN
 */

  function spinWheel() {
    if (
      isSpinning ||
      items.length < MIN_CHOICES
    ) {
      return;
    }

    isSpinning = true;

    spinButton.disabled = true;
    addChoiceButton.disabled = true;
    clearChoicesButton.disabled = true;

    choiceList
      .querySelectorAll("input, button")
      .forEach((control) => {
        control.disabled = true;
      });

    winner.innerHTML = `
      <span class="winner-label">
        Spinning...
      </span>
      <strong>
        Good luck!
      </strong>
    `;

    winner.classList.remove(
      "winner-pop"
    );

    const sliceDegrees =
      360 / items.length;

    const winnerIndex =
      Math.floor(
        Math.random() *
        items.length
      );

    const winnerCenter =
      winnerIndex *
      sliceDegrees +
      sliceDegrees / 2;

    const desiredRotation =
      270 - winnerCenter;

    const normalizedCurrent =
      (
        (
          currentRotation %
          360
        ) +
        360
      ) %
      360;

    const normalizedTarget =
      (
        (
          desiredRotation %
          360
        ) +
        360
      ) %
      360;

    const angleToWinner =
      (
        normalizedTarget -
        normalizedCurrent +
        360
      ) %
      360;

    const rotationAmount =
      FULL_SPINS *
      360 +
      angleToWinner;

    const startRotation =
      currentRotation;

    const startTime =
      performance.now();

    function animate(time) {
      const elapsed =
        time -
        startTime;

      const progress =
        Math.min(
          elapsed /
          SPIN_DURATION,
          1
        );

      const eased =
        1 -
        Math.pow(
          1 -
          progress,
          5
        );

      currentRotation =
        startRotation +
        rotationAmount *
        eased;

      canvas.style.transform =
        `rotate(${currentRotation}deg)`;

      if (progress < 1) {
        requestAnimationFrame(
          animate
        );

        return;
      }

      currentRotation =
        startRotation +
        rotationAmount;

      canvas.style.transform =
        `rotate(${currentRotation}deg)`;

      isSpinning = false;

      spinButton.disabled = false;
      clearChoicesButton.disabled = false;

      choiceList
        .querySelectorAll("input, button")
        .forEach((control) => {
          control.disabled = false;
        });

      updateChoiceCount();

      showWinningResult(
        winnerIndex
      );
    }

    requestAnimationFrame(
      animate
    );
  }

  /*
     BUTTON
  */

  spinButton.addEventListener(
    "click",
    spinWheel
  );

  /* 
     INITIAL STATE
  */

  renderChoiceInputs();

document.fonts.ready.then(() => {
  drawWheel();
});
});