import { useRef, useEffect } from "react";
import { useBeforeunload } from "react-beforeunload";
import "./player.css";
import React from 'react';
import Header from "../header"
import Modal from "../modal"
const createSignalingChannel = require("../../lib/kinesis/createChannel");
const deleteSignalingChannel = require("../../lib/kinesis/deleteChannel");
const startMaster = require("../../lib/kinesis/master");

/**
 * Page that produces video stream and transfers to Viewer
 * @param {string} params.channelName - /master/:channelName. Name of the channel
 * @returns {JSX.Element} WebCAM Master page
 */
function Master() {
    const masterLocalView = useRef();
    const localStream = useRef();
    const closeFunc = useRef();
    const flag = "master"

    const [modalIsOpen, setIsOpen] = React.useState(false);
    const connectionState = useRef(false);

    useBeforeunload((e) => {
        e.preventDefault();
        deleteSignalingChannel();
        if (closeFunc.current) closeFunc.current();
        window.close();
    });

    useEffect(() => {
        const makeLocalStream = async () => {
            try {
                localStream.current = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                masterLocalView.current.srcObject = localStream.current;
            } catch (e) {
                console.error("[MASTER] Could not find webcam");
            }

            await createSignalingChannel()
                .then((channelData) => {
                    return startMaster(
                        channelData.channelData,
                        localStream.current,
                        () => {},
                        (connect) => {
                            connectionState.current = connect;
                        }
                    );
                })
                .then((close) => {
                    closeFunc.current = close;
                })
                .catch((e) => {
                    console.log(e);
                });
        };
        makeLocalStream();
        // eslint-disable-next-line
    }, []);

    return (
        <>
            <Header/>
            <Modal
                flag={flag}
                isShow={modalIsOpen}
                closeCallback={() => setIsOpen(false)}
            />
            <video className="viewer-local-view" autoPlay playsInline controls muted ref={masterLocalView} />
        </>
    );
}

export default Master;
