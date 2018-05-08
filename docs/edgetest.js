let sig = null;
let myId = null;

const peer = new Peer({
    key: 'bea1e09a-a7f9-41fb-8700-e6d18ba907bd',
    iceTransportPolicy: 'relay',
    debug: 3
});
peer.on('open', async id => {
    myId = id;
    console.log('peer open.');
    myIdDisp.textContent = id;
    sig = peer.socket._io;
    console.log(`signalingURL: ${sig.io.uri}`);

    // peer.on('call', async call => {
    //     console.log('peer on call.');
    //     setupCall(call);
    //     const stream = await getStream();
    //     call.answer(stream);
    // });

    peer.listAllPeers(async peers => {
        const remoteId = peers.filter(peerId => peerId !== id)[0];
        if (remoteId) {
            initPC(remoteId);
            // const stream = await getStream();
            // console.log(`call ${remoteId}`);
            // const call = peer.call(remoteId, stream);
            // setupCall(call);
        }
    });
});

let pc = null;

async function initPC(remoteId) {
    pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });
    pc.onicecandidate = evt => {
        if (evt.candidate) {
            sig.emit('candidate', { type: 'candidate', candidate: evt.candidate });
        }
    };
    pc.onnegotiationneeded = async evt => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sigEmit('offer', { offer: pc.localDescription });
    };
    pc.ontrack = evt => {
        console.log('ontrack', `${evt.track.kind}Track`);
        if (!remoteView.srcObject) {
            remoteView.srcObject = evt.streams[0];
        }
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
    } catch (err) {
        console.log('gUM() error', err);
    }
}

function sigEmit(type, data, remoteId) {
    data = { ...data, ...{ src: myId, dst: remoteId } };

}
function setupCall(call) {
    console.log('setupCall()');
    call.on('stream', stream => {
        console.log('call on stream');
        remoteView.srcObject = stream;
    });
}

async function getStream() {
    console.log('getStream()');
    let stream = null;
    if (localView.srcObject) {
        localView.srcObject.getTracks().forEach(track => track.stop());
    }
    if (navigator.userAgent.includes('Edge/17')) {
        stream = await navigator.getDisplayMedia({ video: true });
    } else {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
    }
    localView.srcObject = stream;
    return stream;
}
