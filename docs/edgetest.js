let pcs = {};

const peer = new Peer({
    key: 'bea1e09a-a7f9-41fb-8700-e6d18ba907bd',
});
peer.on('open', async id => {
    console.log('peer open.');
    myIdDisp.textContent = id;
    console.log(`signalingURL: ${peer.socket._io.io.uri}`);
    initSig(peer.socket._io);

    // peer.on('call', async call => {
    //     console.log('peer on call.');
    //     setupCall(call);
    //     const stream = await getStream();
    //     call.answer(stream);
    // });

    peer.listAllPeers(async peers => {
        const remoteId = peers.filter(peerId => peerId !== id)[0];
        if (remoteId) {
            console.log(`remoteId: ${remoteId}`);
            initPC(remoteId);
            // const stream = await getStream();
            // console.log(`call ${remoteId}`);
            // const call = peer.call(remoteId, stream);
            // setupCall(call);
        }
    });
});

async function initPC(remoteId) {
    const pc = pcs[remoteId] = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });
    pc.onicecandidate = evt => {
        if (evt.candidate) {
            console.log('onicecandidate', evt.candidate);
            sig.emit('candidate', { type: 'candidate', candidate: evt.candidate });
        }
    };
    pc.onnegotiationneeded = async evt => {
        console.log('onnegotiationneeded');
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
        stream.getTracks().forEach(track => {
            console.log('addTrack', `${track.kind}Track`);
            pc.addTrack(track, stream);
        });
    } catch (err) {
        console.log('gUM() error', err);
    }
    return pc;
}

function initSig(sig) {
    sig.on('offer', async data => {
        console.log('sig on offer', data);
        const pc = getOrCreatePC(data.src);
        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        sigEmit('answer', {answer});
    });
    sig.on('answer', async data => {
        console.log('sig on answer', data);
        await pcs[data.src].setRemoteDescription(data.answer);
    });
    sig.on('candidate', async data => {
        console.log('sig on candidate', data);
        const pc = getOrCreatePC(data.src);
        await pc.addIceCandidate(data.candidate);
    });
}

function getOrCreatePC(remoteId) {
    return pcs[remoteId] || initPC();
}

function sigEmit(type, data, remoteId) {
    data = { ...data, ...{ src: pcs[remoteId].id, dst: remoteId } };
    console.log('sigEmit()', type, data);
    peer.socket._io.emit(type, data);
}

// function setupCall(call) {
//     console.log('setupCall()');
//     call.on('stream', stream => {
//         console.log('call on stream');
//         remoteView.srcObject = stream;
//     });
// }

// async function getStream() {
//     console.log('getStream()');
//     let stream = null;
//     if (localView.srcObject) {
//         localView.srcObject.getTracks().forEach(track => track.stop());
//     }
//     if (navigator.userAgent.includes('Edge/17')) {
//         stream = await navigator.getDisplayMedia({ video: true });
//     } else {
//         stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     }
//     localView.srcObject = stream;
//     return stream;
// }
