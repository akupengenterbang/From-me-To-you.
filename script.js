const screens = {
    envelope: document.querySelector("#envelope-screen"),
    intro: document.querySelector("#intro-screen"),
    letter: document.querySelector("#letter-screen"),
};

const waxSeal = document.querySelector("[data-open-letter]");
const songAudio = document.querySelector("#song-audio");
const audioToggle = document.querySelector("[data-audio-toggle]");
const songOpen = document.querySelector("[data-song-open]");
const audioStatus = document.querySelector("#audio-status");
const playIcon = document.querySelector("[data-play-icon]");

function showScreen(name, updateHistory = true) {
    const nextScreen = screens[name];
    if (!nextScreen) {
        return;
    }

    Object.entries(screens).forEach(([screenName, screen]) => {
        const isActive = screenName === name;
        screen.hidden = !isActive;
        screen.classList.toggle("is-active", isActive);
    });

    if (name === "envelope") {
        screens.envelope.classList.remove("is-opening");
        waxSeal.disabled = false;
    }

    if (updateHistory && window.location.hash !== `#${name}`) {
        window.history.pushState({ screen: name }, "", `#${name}`);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function openLetterWithScroll() {
    screens.letter.classList.add("is-scrolling-in");
    showScreen("letter");
    window.setTimeout(() => {
        screens.letter.classList.remove("is-scrolling-in");
    }, 900);
}

document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
        const destination = button.dataset.go;
        if (destination === "letter") {
            openLetterWithScroll();
            return;
        }
        showScreen(destination);
    });
});

waxSeal.addEventListener("click", () => {
    if (waxSeal.disabled) {
        return;
    }

    waxSeal.disabled = true;
    screens.envelope.classList.add("is-opening");
    const transitionDelay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 2300;
    window.setTimeout(() => {
        screens.intro.classList.add("is-zooming-in");
        showScreen("intro");
        window.setTimeout(() => {
            screens.intro.classList.remove("is-zooming-in");
        }, 900);
    }, transitionDelay);
});

function updateAudioButton(isPlaying) {
    audioToggle.classList.toggle("is-playing", isPlaying);
    audioToggle.setAttribute("aria-pressed", String(isPlaying));
    audioToggle.setAttribute("aria-label", `${isPlaying ? "Pause" : "Putar"} Message in a Bottle`);
    playIcon.textContent = isPlaying ? "Ⅱ" : "▶";
}

let openingLetter = false;

async function playSongThenOpenLetter() {
    if (openingLetter) {
        return;
    }

    openingLetter = true;
    audioStatus.textContent = "";
    try {
        if (songAudio.paused) {
            await songAudio.play();
        }

        if (songAudio.paused) {
            return;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1200));
        if (!songAudio.paused) {
            openLetterWithScroll();
        }
    } catch (error) {
        if (error && error.name === "AbortError" && songAudio.paused) {
            return;
        }
        audioStatus.textContent = "Audio tidak dapat diputar. Periksa berkas audio di folder assets.";
        console.error("Unable to play the song audio.", error);
    } finally {
        openingLetter = false;
    }
}

audioToggle.addEventListener("click", () => {
    if (songAudio.paused) {
        playSongThenOpenLetter();
        return;
    }

    songAudio.pause();
});

songOpen.addEventListener("click", () => {
    playSongThenOpenLetter();
});

songAudio.addEventListener("play", () => updateAudioButton(true));
songAudio.addEventListener("pause", () => updateAudioButton(false));
songAudio.addEventListener("ended", () => updateAudioButton(false));
songAudio.addEventListener("playing", () => {
    audioStatus.textContent = "";
    updateAudioButton(true);
});
songAudio.addEventListener("error", () => {
    audioStatus.textContent = "Audio gagal dimuat. Periksa berkas audio di folder assets.";
    console.error("Unable to load the song audio.", songAudio.error);
});

window.addEventListener("popstate", () => {
    const screenName = window.location.hash.slice(1) || "envelope";
    showScreen(screenName, false);
});

const initialScreen = window.location.hash.slice(1);
if (initialScreen in screens) {
    showScreen(initialScreen, false);
}
