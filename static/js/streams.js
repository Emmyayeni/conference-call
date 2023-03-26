
const APP_ID = '4ba68166b9ab4c2ea3f75067647f6c84'
const TOKEN = sessionStorage.getItem('token')
const CHANNEL = sessionStorage.getItem('room')
let UID = sessionStorage.getItem('UID')

let NAME = sessionStorage.getItem('name')

const client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})


let localTracks = []
let remoteUsers = {}

let joinAndDisplayLocalStream = async () => {
    document.getElementById('room-name').innerText = `Room : ${CHANNEL}`
    client.on('user-published', handleUserJoined)
    client.on('user-left', handleUserLeft)

    try{
        UID = await client.join(APP_ID, CHANNEL, TOKEN, UID)
    }catch(error){
        console.error(error)
        window.open('/', '_self')
    }
    


    localTracks = await AgoraRTC.createMicrophoneAudioTrack()

    let member = await createMember()

    var random_number =Math.floor(Math.random() * 10);

    let player = `
                <div class="video-container" id=user-container-${UID}>
                    <div class="video-player" id=user-${UID}><svg width="100px" height="100px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
                    <div class="container" id=container-${UID} >  
                    <div class="voice-animation"></div>
                    </div>
                    </div> 
                    <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
                </div>

                `
   
    document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
    localTracks.play(`user-${UID}`)

    initVolumeIndicator()

    await client.publish([localTracks])
}

let handleUserJoined = async (user, mediaType) => {
    remoteUsers[user.uid] = user
    await client.subscribe(user, mediaType)

    if (mediaType === 'audio'){
        let player = document.getElementById(`user-container-${user.uid}`)
        if (player != null){
            player.remove()
        }

        let member = await getMember(user)
        var random_number =Math.floor(Math.random() * 10);
    
        player = `
        <div class="video-container" id=user-container-${user.uid}>
            <div class="video-player" id=user-${user.uid}><svg width="100px" height="100px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
            <div class="container" id=container-${user.uid}>  
            <div class="voice-animation"></div>
            </div>
            
            </div> 
            <div class="username-wrapper"><span class="user-name">${member.name}</span></div>
        </div>
       
        `
        initVolumeIndicator()
        document.getElementById('video-streams').insertAdjacentHTML('beforeend', player)
        localTracks.play(`user-${user.id}`)
      
    }

    // if (mediaType === 'audio'){
    //     user.audioTrack.play(`user-${user.uid}`)
    // }
}

let handleUserLeft = async (user) => {
    delete remoteUsers[user.uid]
    document.getElementById(`user-container-${user.uid}`).remove()
}

let leaveAndRemoveLocalStream = async () => {
        localTracks.stop()
        localTracks.close()
    
    await client.leave()
    //This is somewhat of an issue because if user leaves without actaull pressing leave button, it will not trigger
    deleteMember()
    window.open('/', '_self')
}

let toggleCamera = async (e) => {
    console.log('TOGGLE CAMERA TRIGGERED')
    if(localTracks.muted){
        await localTracks[1].setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks[1].setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let toggleMic = async (e) => {
    console.log('TOGGLE MIC TRIGGERED')
    if(localTracks.muted){
        await localTracks.setMuted(false)
        e.target.style.backgroundColor = '#fff'
    }else{
        await localTracks.setMuted(true)
        e.target.style.backgroundColor = 'rgb(255, 80, 80, 1)'
    }
}

let createMember = async () => {
    let response = await fetch('/create_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
    return member
}


let getMember = async (user) => {
    let response = await fetch(`/get_member/?UID=${user.uid}&room_name=${CHANNEL}`)
    let member = await response.json()
    return member
}

let deleteMember = async () => {
    let response = await fetch('/delete_member/', {
        method:'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body:JSON.stringify({'name':NAME, 'room_name':CHANNEL, 'UID':UID})
    })
    let member = await response.json()
}

window.addEventListener("beforeunload",deleteMember);


let initVolumeIndicator = async () => {
    client.enableAudioVolumeIndicator();
    client.on("volume-indicator", volumes => {
        console.log(`volumes: ${volumes}`);
        volumes.forEach((volume) => {
            item = document.getElementById(`container-${volume.uid}`)
            console.log(`UID ${volume.uid} Level ${volume.level}`)
            if(volume.level >= 30){ 
                item.style.display="block";
            }else{
                item.style.display="none";
            }
      });
    })
}
  

joinAndDisplayLocalStream()

document.getElementById('mic').addEventListener('click', toggleMic)
document.getElementById('camera').addEventListener('click', toggleCamera)
document.getElementById('Leave').addEventListener('click', leaveAndRemoveLocalStream)


