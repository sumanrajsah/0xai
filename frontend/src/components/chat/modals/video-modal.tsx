import { useEffect, useRef, useState } from "react";
import './video-modal.css'
import { BrainCircuit, Images, Info, Layers, LogOut, Pickaxe, PlusCircle, Server, Settings, Telescope, User2, Wrench, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useAuth } from "../../../../hooks/useAuth";
import { useAlert } from "../../../../context/alertContext";
import Image from "next/image";
import axios from "axios";
import { useChat, useImagePlaygound, useVideoPlayground, useWorkspace } from "../../../../context/ChatContext";
import ModalCont from "../../modal/modalCont";



const VideoModal = () => {
    const { expandVideo } = useVideoPlayground() as { expandVideo?: VideoMetadata };
    const [videoLoaded, setVideoLoaded] = useState(false);
    const [video, setVideo] = useState(true);
    if (!expandVideo) {
        return null;
    }

    useEffect(() => {
        const video = document.createElement('video');
        video.src = expandVideo.video_url;

        video.onloadeddata = () => {
            setVideoLoaded(true);
        };

        video.onerror = (error: any) => {
            console.error("Video failed to load", error);
            setVideoLoaded(true);
        };

        // Cleanup function
        return () => {
            video.onloadeddata = null;
            video.onerror = null;
            video.src = '';
        };
    }, [expandVideo?.video_url]);

    console.log(expandVideo);

    return (
        <ModalCont>
            <div className="toggle-buttons">
                <button
                    className={video ? 'active' : ''}
                    onClick={() => setVideo(true)}
                >
                    <Images size={12} /> Video
                </button>
                <button
                    className={!video ? 'active' : ''}
                    onClick={() => setVideo(false)}
                >
                    <Info size={12} />Info
                </button>
            </div>

            {!videoLoaded && <div className='loading-img'> <Image
                src={'/sitraone.png'} // Icons stored in the public folder
                alt={'0xXplorer AI'}
                width={30}
                height={30}
            /></div>}
            {videoLoaded && expandVideo && video && <video
                src={expandVideo.video_url}
                controls
                autoPlay
                loop
                className="expanded-vid"
            />}
            {!video && <div className="video-info">
                <label>Model:</label>
                <p>{expandVideo?.model.name}</p>
                <label>Created:</label>
                <p>{expandVideo?.created ? new Date(expandVideo.created).toLocaleString() : ''}</p>
                {expandVideo?.revised_prompt && <label>Revised Prompt</label>}
                {expandVideo?.revised_prompt && <p>{expandVideo?.revised_prompt}</p>}
                {expandVideo?.prompt && <label>Prompt</label>}
                {expandVideo?.prompt && <p>{expandVideo?.prompt}</p>}
                {expandVideo?.config && <label>Config</label>}
                {expandVideo?.config && <p>{expandVideo?.config.resolution}</p>}
            </div>}

        </ModalCont>
    );
};

export default VideoModal;
