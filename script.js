let currentSong = new Audio()
let songsList;
let currntFolder;


function formatTime(seconds) {

    if (isNaN(seconds)) {
        return "00:00";
    }
    seconds = Math.floor(seconds);  // remove decimal part

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}





async function getsongs(folder) {
    currntFolder = folder

    let url = await `/src/Songs/${folder}/`;
    let FetchSong = await fetch(url);
    let response = await FetchSong.text();

    let SongStorediv = document.createElement('div')
    SongStorediv.innerHTML = response

    let alinks = SongStorediv.getElementsByTagName('a')

    songsList = [];

    for (let index = 0; index < alinks.length; index++) {
        const element = alinks[index];
        if (element.href.endsWith(".mp3")) {
            songsList.push(element.href.split(`%5C${folder}%5C`)[1].replaceAll(".mp3", ""))
        }

    }



    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""

    for (const song of songsList) {
        songUL.innerHTML = songUL.innerHTML + `
    
    <li> 
    <div class="flex frontpart">

                                <img class="play-btminlist"  src="src/music-svgrepo-com.svg" alt="Music">
                                <div class="info">
                                <div>${song.replaceAll("%20", " ")}</div>
                                </div> 
                            </div>
                            <span class="playnow">
                                <img class="invert play-btminlist" src="src/play-button-svgrepo-com.svg"  alt="Play" >
                            </span>
                        </li> `;
    }

    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e) => {
        e.addEventListener('click', (element) => {

            playMusic(e.querySelector(".info").getElementsByTagName('div')[0].innerHTML);
        })


    });











    return songsList;
}



function playMusic(track, pause = false) {
    currentSong.src = `src/Songs/${currntFolder}/${track}.mp3`



    if (!pause) {
        currentSong.play();
        play.src = "src/pause.svg"
    }

    document.querySelector(".songInfo").innerHTML = decodeURI(track)
    document.querySelector(".SongTime").innerHTML = "00:00 / 00:00"
}






async function displayAlbums() {

    let url = await `/src/Songs/`;
    let FetchSong = await fetch(url);
    let response = await FetchSong.text();

    let SongStorediv = document.createElement('div')
    SongStorediv.innerHTML = response
    let anchors = SongStorediv.getElementsByTagName("a")



    let array = (anchors) 
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        
    

        if (e.href.includes("%5CSongs%5C")) {
            let folder = (e.href.split("%5C").slice(-1)[0].replace("/", ""));
            let url = `/src/Songs/${folder}/info.json`;
            let FetchSong = await fetch(url);
            let response = await FetchSong.json();
            let CardContainer = document.querySelector(".card-container");
            CardContainer.innerHTML = CardContainer.innerHTML + `
            
                                <div data-folder="${folder}" class="card">
                         <div class="play"> 
                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg> 
                         </div> 
                         <div class="imgforbradius">

                              <img class="rounded" src="src/Songs/${folder}/cover.jpg/" alt=""> 
                             <div>
                        </div>

                            <h3>${response.title}</h3>
                            <p>${response.description}</p>
                            </div>
                    </div>

            `
        }
        
    Array.from(document.getElementsByClassName("card")).forEach(element => {

        element.addEventListener("click", async e => {
            console.log(e.currentTarget.dataset.folder);
            songsList = await getsongs(e.currentTarget.dataset.folder);

            playMusic(songsList[0], true);

        })

    });



    }







}














async function main() {

    await getsongs("Album1")
    playMusic(songsList[0], true);

    displayAlbums();

    play.addEventListener(('click'), () => {

        if (currentSong.paused) {
            currentSong.play();
            play.src = "src/pause.svg"

        }
        else {
            currentSong.pause();
            play.src = "src/play-button-svgrepo-com.svg"
        }

    })



    forward.addEventListener("click", () => {
        currentSong.pause()
        console.log(songsList);
        let index = songsList.indexOf(currentSong.src.split(`/src/Songs/${currntFolder}/`)[1].replaceAll(".mp3", ""));
        if ((index + 1) < songsList.length) {
            console.log(songsList[index + 1]);

            playMusic(songsList[index + 1])

        }
    })


    pervious.addEventListener("click", () => {
        currentSong.pause()

        let index = songsList.indexOf(currentSong.src.split(`/src/Songs/${currntFolder}/`)[1].replaceAll(".mp3", ""));
        console.log(index);

        if ((index - 1) >= 0) {
            playMusic(songsList[index - 1])
        }


    })














    currentSong.addEventListener("timeupdate", () => {

        document.querySelector('.SongTime').innerHTML = `${formatTime(currentSong.currentTime)}/${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%"
    })

    document.querySelector(".seekbar").addEventListener('click', (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;

    })

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0%"
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%"

    })


    document.querySelector(".volume-range").addEventListener(("change"), (e) => {

        currentSong.volume = parseInt(e.target.value) / 100


    })
    
    document.querySelector(".volume>img").addEventListener(("click"),e=>{
        if(e.target.src.includes("volume-max-svgrepo-com.svg")){
            
            console.log(e.target.src);
            e.target.src = e.target.src.replace("volume-max-svgrepo-com.svg","mute.svg");
            currentSong.volume = 0; 
                document.querySelector(".volume-range").value = 0;
                
            }
        else{
            e.target.src = e.target.src.replace("mute.svg","volume-max-svgrepo-com.svg");
            
            currentSong.volume = 0.1;
            document.querySelector(".volume-range").value = 10;

        }
        
    })







}


main();

