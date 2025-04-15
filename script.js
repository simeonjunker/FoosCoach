document.addEventListener("DOMContentLoaded", function() {

    /*
        FULLSCREEN
        taken from here: https://www.w3schools.com/jsref/met_element_requestfullscreen.asp
    */

    /* Get the documentElement (<html>) to display the page in fullscreen */
    var elem = document.documentElement;

    /* View in fullscreen */
    function openFullscreen() {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    }

    /* Close fullscreen */
    function closeFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }

    /*
        WAKE LOCK
        taken from here: https://www.slingacademy.com/article/prevent-screen-sleep-with-the-screen-wake-lock-api-in-javascript/
    */

    // Ensure that the Wake Lock API is available
    if ('wakeLock' in navigator) {
        let wakelock = null;
        
        // Create an async function to request a wake lock
        async function requestWakeLock() {
            try {
                // Request the screen wake lock
                wakelock = await navigator.wakeLock.request('screen');
                console.log('Wake Lock is active!');

                // Listen for the 'release' event
                wakelock.addEventListener('release', () => {
                    console.log('Wake Lock was released');
                });
            } catch (err) {
                // Handle the error, e.g., display a message to the user
                console.error(`Could not obtain wake lock: ${err.name}, ${err.message}`);
            }
        }

        // Automatically release the wake lock when the page is hidden
        document.addEventListener('visibilitychange', () => {
            if (wakelock !== null && document.hidden) {
            wakelock.release()
                .then(() => console.log('Wake lock on page visibility change.'));
            } else if (!document.hidden) {
            requestWakeLock();
            }
        });

        // Request wake lock when needed
        requestWakeLock();
    }

    /*
        PARSE INPUTS
    */

    function getTrueIndices(array) {
        return array.reduce((acc, value, index) => {
            if (value) {
                acc.push(index);
            }
            return acc;
        }, []);
}
    // read inputs
    const paramsString = window.location.search;
    const searchParams = new URLSearchParams(paramsString);
    console.log(searchParams);
 
    // target positions
    const pos0=JSON.parse(searchParams.get("pos0"));
    const pos1=JSON.parse(searchParams.get("pos1"));
    const pos2=JSON.parse(searchParams.get("pos2"));
    const pos3=JSON.parse(searchParams.get("pos3"));
    const pos4=JSON.parse(searchParams.get("pos4"));
    const availablePositions = getTrueIndices([pos0,pos1,pos2,pos3,pos4]);

    // timings
    const prepareTime=parseInt(searchParams.get("prepareTime")) * 1000;
    const readyTime=parseInt(searchParams.get("readyTime")) * 1000;
    const minWait=parseInt(searchParams.get("minWaitTime")) * 1000;
    const maxWait=parseInt(searchParams.get("maxWaitTime")) * 1000;
    const highlightTime=parseInt(searchParams.get("highlightTime")) * 1000;
    const refreshTime=parseInt(searchParams.get("refreshTime")) * 1000;
    
    // sounds
    const doClick = JSON.parse(searchParams.get("doClick"));
    const doBeep = JSON.parse(searchParams.get("doBeep"));
    const doAnnounce = JSON.parse(searchParams.get("doAnnounce"));

    // other variable settings
    const screen = document.querySelector('html');
    let isRunning = true;
    let timeout;
    screen.onclick = function(){togglePause()};
    const sections = document.querySelectorAll('.section');
    const overlay = document.getElementById('overlay');
    
    const beepSound = new Audio('assets/sound/beep.ogg');
    const tickSound = new Audio('assets/sound/tick.ogg');
    const leftSound = new Audio('assets/sound/announce/ger/0.mp3');
    const halfleftSound = new Audio('assets/sound/announce/ger/1.mp3');
    const middleSound = new Audio('assets/sound/announce/ger/2.mp3');
    const halfrightSound = new Audio('assets/sound/announce/ger/3.mp3');
    const rightSound = new Audio('assets/sound/announce/ger/4.mp3');
    const announcements = [leftSound, halfleftSound, middleSound, halfrightSound, rightSound]
    const playRate=1; // play rate for audio (1 is normal speed)
    for (let i = 0; i < 5; i++) {
        announcements[i].playbackRate = playRate;
    }
    
    /*
        CORE FUNCTIONS
    */

    function playTick(){
        if (doClick) {
            console.log('tick!');
            tickSound.play();
        }
    }

    function playBeep(){
        if (doBeep) {
            console.log('beep!')
            beepSound.play();
        }
    }

    function playPos(idx){
        if (doAnnounce) {
            announcements[idx].play();
        }
    };

    function getRandomDuration(min=minWait,max=maxWait){
        const randomDuration = Math.floor(Math.random() * (max - min)) + min;
        return randomDuration;
    };

    function restartLoop(overlayText='Ball auf die Drei'){
        overlay.textContent = overlayText;
        overlay.style.backgroundColor = 'red';
        overlay.classList.add('visible');
        timeout = setTimeout(() => {
            getReady();
        }, prepareTime);
    };

    function getReady(overlayText='Mach dich bereit!'){
        overlay.textContent = overlayText;
        overlay.style.backgroundColor = 'yellow';
        timeout = setTimeout(() => {
            overlay.classList.remove('visible');
            highlightRandomSection();
        }, readyTime);
    };

    function getRandomSection(sections, availPos=availablePositions) {
        let randomIndex = availPos[Math.floor(Math.random() * availPos.length)];
        let section = sections[randomIndex];
        return [randomIndex, section]
    };
    
    function highlightRandomSection() {
        // highlight section
        let randomDuration = getRandomDuration();
        let [section_idx, currentHighlighted] = getRandomSection(sections);
        console.log(randomDuration, currentHighlighted.id);
        click_interval = setInterval(playTick, 1000);
        timeout = setTimeout(() => {
            // select random section and make red
            clearInterval(click_interval);
            playPos(section_idx);
            playBeep();
            currentHighlighted.style.backgroundColor = 'green';
            // go back to overlay (after set period of time)
            timeout = setTimeout(() => {
                currentHighlighted.style.backgroundColor = 'black';
                currentHighlighted = null;
                timeout = setTimeout(() => {restartLoop();}, refreshTime);
            }, highlightTime); // Reset after 3 seconds
        }, randomDuration);
    };

    function togglePause() {
        if (isRunning) {
            console.log('pause!')
            if (timeout) {
                clearTimeout(timeout);
            };
            overlay.textContent = 'Pause!';
            overlay.style.backgroundColor = 'white';
            for (let i = 0; i < sections.length; i++) {
                sections[i].style.backgroundColor = 'black';
            }
            closeFullscreen();
            overlay.classList.add('visible');
            isRunning = false;
        } else {
            console.log('resume!')
            openFullscreen();
            overlay.textContent = 'Weiter!';
            setTimeout(() => {
                overlay.classList.remove('visible');
                restartLoop();
                isRunning = true;
            }, 1000)
        };
    };

    /*
        RUN
    */

    openFullscreen();
    restartLoop();
});