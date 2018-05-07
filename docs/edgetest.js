const peer = new Peer({ key: 'bea1e09a-a7f9-41fb-8700-e6d18ba907bd' });
peer.on('open', async id => {
    console.log('peer open.');
    myIdDisp.textContent = id;

    peer.on('call', async call => {
        console.log('peer on call.');
        setupCall(call);
        const stream = await getStream();
        localView.srcObject = stream;
        call.answer(stream);
    });

    peer.listAllPeers(async peers => {
        const remoteId = peers.filter(peerId => peerId !== id)[0];
        if (remoteId) {
            const stream = await getStream();
            localView.srcObject = stream;
            console.log(`call ${remoteId}`);
            const call = peer.call(remoteId, stream);
            setupCall(call);
        }
    });
});

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
    // if (navigator.userAgent.includes('Edge/17')) {
    //     stream = await navigator.getDisplayMedia({ video: true });
    // } else {
         stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // }
    return stream;
}
