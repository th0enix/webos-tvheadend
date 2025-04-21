import React, { useContext, useEffect, useRef, useState } from 'react';

import ChannelSettings from './ChannelSettings';
import AppContext, { AppVisibilityState } from '../AppContext';
import '../styles/app.css';
import { AppViewState } from '../App';
import RecordingList from './RecordingList';
import EPGEvent from '../models/EPGEvent';
import EPGChannelRecording from '../models/EPGChannelRecording';

export enum State {
    PLAYER = 'player',
    PLAYER_INFO = 'playerInfo',
    RECORDINGS_LIST = 'recordingsList',
    RECORDINGS_SETTINGS = 'recordingSettings'
}

const Player = () => {
    const {
        persistentAuthToken,
        currentRecordingPosition,
        setCurrentRecordingPosition,
        menuState,
        appViewState,
        appVisibilityState,
        tvhDataService,
        epgData
    } = useContext(AppContext);

    const tvWrapper = useRef<HTMLDivElement>(null);
    const video = useRef<HTMLVideoElement>(null);
    const audioTracksRef = useRef<AudioTrackList>();
    const textTracksRef = useRef<TextTrackList>();
    const [recordings, setRecordings] = useState<EPGChannelRecording[]>([]);

    //const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [state, setState] = useState<State>(State.PLAYER);

    const focus = () => tvWrapper.current?.focus();

    const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
        // in case we are in menu state we don't handle any keypress
        if (menuState || state == State.RECORDINGS_LIST) {
            return;
        }
        const keyCode = event.keyCode;

        switch (keyCode) {
            case 34: // programm down
                event.stopPropagation();
                // channel down
                if (currentRecordingPosition === 0) {
                    return;
                }
                changeChannelPosition(currentRecordingPosition - 1);
                break;
            case 40: // arrow down
                event.stopPropagation();
                setState(State.RECORDINGS_LIST);
                break;
            case 33: // programm up
                event.stopPropagation();
                // channel up
                if (currentRecordingPosition === recordings.length - 1) {
                    return;
                }
                changeChannelPosition(currentRecordingPosition + 1);
                break;
            case 67: // 'c'
            case 38: // arrow up
                event.stopPropagation();
                setState(State.RECORDINGS_LIST);
                break;
            case 13: {
                // ok button ->show/disable channel info
                event.stopPropagation();
                handleChannelInfoSwitch();
                break;
            }
            case 405: // yellow button
            case 89: //'y'
                event.stopPropagation();
                handleChannelSettingsSwitch();
                break;
            case 461: // backbutton
                event.stopPropagation();
                setState(State.PLAYER);
                break;
            case 404: // green button
            case 71: //'g'
                // note that this key event should be passed to app
                setState(State.PLAYER);
                break;
            default:
                console.log('Player-keyPressed:', keyCode);
        }
    };

    const handleChannelInfoSwitch = () => {
        state !== State.PLAYER_INFO ? setState(State.PLAYER_INFO) : setState(State.PLAYER);
    };

    const handleChannelSettingsSwitch = () => {
        // if we don't have any audio tracks or text tracks we don't get into channel settings state
        if (!audioTracksRef.current && !textTracksRef.current) {
            return;
        }

        state !== State.RECORDINGS_SETTINGS ? setState(State.RECORDINGS_SETTINGS) : setState(State.PLAYER);
    };

    const handleScrollWheel = () => {
        setState(State.RECORDINGS_LIST);
    };

    const handleClick = () => {
        handleChannelInfoSwitch();
    };

    const deleteRecording = (event: EPGEvent) => {
        if (!event) {
            return;
        }
        // if delete event is current play event stop player first
        if (event === getCurrentChannel()?.getEvents()[0]) {
            const video = getMediaElement();
            video && resetPlayer(video);
            setCurrentRecordingPosition(-1);
        }

        tvhDataService?.deleteRec(event, (newrecordings) => setRecordings(newrecordings), persistentAuthToken);
    };

    const cancelRecording = (event: EPGEvent) => {
        console.log(event);

        if (!event) {
            return;
        }

        tvhDataService?.cancelRec(
            event,
            (newrecordings) => {
                setRecordings(newrecordings);
                epgData.updateRecordings(
                    newrecordings.filter((rec) => rec.getKind() === 'REC_UPCOMING').map((rec) => rec.getEvents()[0])
                );
            },
            persistentAuthToken
        );
    };

    const getMediaElement = () => video.current;

    const changeChannelPosition = (newChannelPosition: number) => {
        if (newChannelPosition === currentRecordingPosition) {
            return;
        }
        setCurrentRecordingPosition(newChannelPosition);

        // store last used recording
        //StorageHelper.setLastChannelIndex(newChannelPosition);
    };

    const handleLoadedMetaData = () => {
        const videoElement = getMediaElement();
        if (!videoElement) return;

        // restore selected audio channel from storage
        const audioTracks = videoElement.audioTracks;
        const textTracks = videoElement.textTracks;
        const currentChannel = getCurrentChannel();
        if (!currentChannel) return;
        //const index = StorageHelper.getLastAudioTrackIndex(currentChannel.getName());
        // if (index && index < audioTracks.length) {
        //     console.log('restore index %d for channel %s', index, currentChannel.getName());
        //     for (let i = 0; i < audioTracks.length; i++) {
        //         // stored track index is already enabled
        //         audioTracks[i].enabled = i === index;
        //     }
        // }

        setAudioTracks(audioTracks);
        setTextTracks(textTracks);
    };

    const setAudioTracks = (audioTracks: AudioTrackList | undefined) => {
        audioTracksRef.current = audioTracks;
    };

    const setTextTracks = (textTracks: TextTrackList | undefined) => {
        textTracksRef.current = textTracks;
    };

    const resetPlayer = (videoElement: HTMLVideoElement) => {
        setAudioTracks(undefined);
        setTextTracks(undefined);

        // Remove all source elements
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }

        // Reset video
        videoElement.load();
    };

    const changeSource = (dataUrl: URL) => {
        const videoElement = getMediaElement();
        if (!videoElement) return;

        resetPlayer(videoElement);
        //setIsVideoPlaying(false);

        //const options = {
        //    mediaTransportType: 'URI'
        //};

        // Convert the created object to JSON string and encode it.
        //const mediaOption = encodeURI(JSON.stringify(options));

        // Add new source element
        const source = document.createElement('source');

        // Add attributes to the created source element for media content.
        source.setAttribute('src', dataUrl.toString());
        //source.setAttribute('type', 'video/mp2t;mediaOption=' + mediaOption);
        //source.setAttribute('src', 'https://www.w3schools.com/html/mov_bbb.mp4');
        //source.setAttribute('type', 'video/mp4');
        videoElement.appendChild(source);

        // Auto-play video with some (unused) error handling
        const playPromise = videoElement.play();
        // workarund for promise not beeing returned in webos 3.x
        if (playPromise !== undefined) {
            playPromise.catch((error) => console.log('recording switched before it could be played', error));
        }
    };

    const getWidth = () => window.innerWidth;
    const getHeight = () => window.innerHeight;
    const getCurrentChannel = () => recordings[currentRecordingPosition];

    const updateStreamSource = (streamUrl: URL) => {
        // show the channel info, if the channel was changed
        setState(State.PLAYER_INFO);

        changeSource(streamUrl);
    };

    useEffect(() => {
        tvhDataService?.retrieveRecordings(persistentAuthToken).then((result) => {
            setRecordings(result);
            setState(State.RECORDINGS_LIST);
        });

        focus();

        return () => {
            const videoElement = getMediaElement();
            if (!videoElement) return;
            resetPlayer(videoElement);

            // reset current recording position
            setCurrentRecordingPosition(-1);
        };
    }, []);

    useEffect(() => {
        // change channel in case we have channels retrieved and channel position changed
        if (recordings.length > 0) {
            const currentChannel = getCurrentChannel();
            if (currentChannel && currentChannel.getChannelID() !== currentRecordingPosition) {
                updateStreamSource(currentChannel.getStreamUrl());
            }
        }
    }, [currentRecordingPosition]);

    useEffect(() => {
        // request focus if none of the other components are active
        if (state === State.PLAYER) {
            focus();
        }
    }, [state]);

    useEffect(() => {
        // if the channel info is shown, also show the current channel number
        if (appViewState === AppViewState.RECORDINGS) {
            focus();
        }
    }, [appViewState, menuState]);
    /**
     * handle app state changes
     */
    useEffect(() => {
        // state changed to focus -> refocus
        if (appVisibilityState === AppVisibilityState.FOCUSED) {
            console.log('Player: changed to focused');
            setState(State.PLAYER_INFO);
            focus();
        }

        // state changed to background -> stop playback
        if (appVisibilityState === AppVisibilityState.BACKGROUND) {
            console.log('Player: changed to background');
            const videoElement = getMediaElement();
            if (!videoElement) return;
            resetPlayer(videoElement);
        }

        // state changed to foreground -> start playback
        if (appVisibilityState === AppVisibilityState.FOREGROUND) {
            console.log('Player: changed to foreground');
            const currentChannel = getCurrentChannel();
            // manually call update because we want to start the channel as we
            // have in the context -> no context change -> no effect
            // also we only do it if video has no source attached because on
            // first mount the source gets attached by currentChannelPosition effect
            currentChannel && !video.current?.firstChild && updateStreamSource(currentChannel.getStreamUrl());
            focus();
        }
    }, [appVisibilityState]);

    return (
        <div
            id="tv-wrapper"
            ref={tvWrapper}
            tabIndex={-1}
            onKeyDown={handleKeyPress}
            onWheel={handleScrollWheel}
            onClick={handleClick}
        >
            {state === State.RECORDINGS_SETTINGS && (
                <ChannelSettings
                    channelName={getCurrentChannel()?.getName() || ''}
                    audioTracks={audioTracksRef.current}
                    textTracks={textTracksRef.current}
                    unmount={() => setState(State.PLAYER)}
                />
            )}

            {state === State.RECORDINGS_LIST && (
                <RecordingList
                    deleteRecording={(event) => deleteRecording(event)}
                    cancelRecording={(event) => cancelRecording(event)}
                    recordings={recordings}
                    unmount={() => {
                        console.log('unmounting reclist');
                        setState(State.PLAYER);
                    }}
                />
            )}

            <video
                id="myVideo"
                ref={video}
                width={getWidth()}
                height={getHeight()}
                preload="none"
                controls
                onLoadedMetadata={handleLoadedMetaData}
            ></video>
        </div>
    );
};

export default Player;
