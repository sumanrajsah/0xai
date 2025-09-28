"use client"; // Ensure this component is rendered on the client side
import React, { useEffect, useRef, useState } from 'react';
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from "rehype-raw";
import rehypeExternalLinks from "rehype-external-links";
import remarkMath from 'remark-math';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { ChevronRight, ChevronUp, ClipboardCopy, Copy, Download, Pencil, RefreshCcw, ThumbsDown, ThumbsUp } from 'lucide-react'; // Import a copy icon
import Image from 'next/image'; // Next.js optimized image component
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import rehypeKatex from 'rehype-katex';

import './style.css'
import { dark, nightOwl, vs, vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useTheme } from 'next-themes';

import { useAlert } from '@/context/alertContext';
import FilePreview from '@/components/filepreview';
import { useChat } from '@/context/chatContext';



interface ChatMessageProps {
    content: string;
    role: string;
    type: string;
    filename?: string;
}


const TextUserMessage: React.FC<ChatMessageProps> = ({ content, role, type, filename }) => {
    const alertMessage = useAlert()

    const [copyText, setCopyText] = useState<String>('Copy')
    // console.log(bytecode, abi)
    console.log(content, type)
    const { aiTyping, setAiTyping, setEditInput } = useChat();
    const [isImageLoaded, setImageLoaded] = useState(false);
    const [openImageModal, setOpenImageModal] = useState(false);
    const [selectedImage, setSelectImage] = useState<string | null>(null);

    const messageRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [showToolsData, setShowToolsData] = useState<boolean>(false);
    const { theme } = useTheme();

    useEffect(() => {
        if (type === 'image_url' && role !== 'user') {
            const img = document.createElement('img');
            const imageUrl = content;
            // console.log(imageUrl)

            img.src = imageUrl;

            img.onload = () => {
                setImageLoaded(true);
            };

            img.onerror = (error) => {
                console.error("Image failed to load", error);
                setImageLoaded(true); // or false based on your UI handling
            };
        }
    }, [content, type]);


    useEffect(() => {

        const handleUserScroll = () => {
            setAutoScroll(false); // Disable auto-scroll when the user interacts
        };

        if (containerRef.current) {
            containerRef.current.addEventListener('scroll', handleUserScroll, { passive: true });
        }

        return () => {
            if (containerRef.current) {
                containerRef.current.removeEventListener('scroll', handleUserScroll);
            }
        };
    }, []);

    const handleDownload = async (imageUrl: string) => {
        try {
            const response = await fetch(imageUrl, { mode: 'cors' });
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'image.png'; // or generate from timestamp
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Image download failed:', err);
        }
    };

    useEffect(() => {
        if (autoScroll && messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [messageRef, autoScroll]);
    // Custom renderer for links
    const renderLink: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = (props) => {
        return (
            <a
                href={props.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
            >
                {props.children}
            </a>
        );
    };

    // Function to copy the entire message to clipboard
    const copyMessageToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alertMessage.success('Copied!') // You can replace this with a toast notification
            })
            .catch((err) => {
                console.error('Failed to copy message: ', err);
            });
    };
    function extractThoughts(response: string): { visibleText: string; thoughtText: string[] } {
        const thoughts = [...response.matchAll(/<think>(.*?)<\/think>/gi)].map(m => m[1]);
        const visibleText = response
            .replace(/<think>([\s\S]*?)<\/think>/gi, '') // remove all <think>...</think> // normalize extra whitespace
            .trim();
        // console.log(visibleText, thoughts)
        return { visibleText, thoughtText: thoughts };
    }


    // Custom renderer for code blocks
    // Custom renderer for code blocks
    const renderCode = ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '');
        const codeText = String(children).replace(/\n$/, '');
        const language = match ? match[1] : 'text'; // Default to 'text' if no language is specified

        return !inline && match ? (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',

                    background: 'linear-gradient(95deg,rgba(var(--bg-color1), 0.15),rgba(var(--bg-color1), 0.05))', // Dark background like ChatGPT
                    borderRadius: "8px", // Smooth rounded corners
                    fontSize: "14px",
                    lineHeight: "1",
                    overflowX: "auto", // Subtle border for contrast
                    boxShadow: "0 6px 10px rgba(0, 0, 0, 0.35),inset 0 1px 2px rgba(255, 255, 255, 0.25)",
                }}
            >

                {/* Header Section */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: "10px",
                        width: '100%',
                        fontSize: "14px",
                        lineHeight: "1.2",
                        overflowX: "auto",
                    }}
                >
                    {/* Language Name */}
                    <span
                    >
                        {language}
                    </span>

                    {/* Copy Button */}
                    <button
                        onClick={() => copyMessageToClipboard(codeText)}
                        className='copy-button2'
                    >
                        <Copy size={15} />{copyText}{/* Copy icon */}
                    </button>
                </div>

                {/* Code Block */}
                <SyntaxHighlighter
                    style={theme === 'dark' ? vs2015 : vs} // Use different styles based on theme
                    language={language}
                    PreTag="div"
                    customStyle={{
                        position: 'relative',
                        padding: '10px',
                        background: theme === 'dark' ? "var(--prop-dark-bg" : 'var(--prop-white-bg', // Dark background like ChatGPT
                        fontSize: "14px",
                        lineHeight: "1.2",
                        overflowX: "auto",
                        width: "100%",
                        borderRadius: "10px 10px 0 0"
                    }}
                    codeTagProps={{
                        style: { fontFamily: "monospace", fontWeight: "500" }, // Better font
                    }}
                    wrapLongLines={true} // Ensures long lines wrap instead of overflowing
                    {...props}
                >
                    {codeText}
                </SyntaxHighlighter>
            </div>
        ) : (
            <code className={className} {...props}>
                {children}
            </code>
        );
    };

    // Custom renderer for images
    const renderImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        return (
            <img
                src={props.src || ''}
                alt={props.alt}
                style={{ maxWidth: '100%', borderRadius: '8px', margin: '10px 0', height: window.innerWidth < 768 ? "150px" : "250px", width: window.innerWidth < 768 ? "150px" : "250px" }}
            />
        );
    };

    const renderMath = (props: { value: any; isInline: boolean }) => {
        const { value, isInline } = props;
        //console.log(`Rendering ${isInline ? 'inline' : 'block'} math:`, value); // Debugging
        return isInline ? <InlineMath math={value} /> : <BlockMath math={value} />;
    };
    const beautifyJSON = (input: string | object): string => {
        try {
            let obj = typeof input === 'string' ? input : JSON.stringify(input);

            // Try first parse
            obj = JSON.parse(obj);

            // If the result is still a string, try parsing again
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }

            return JSON.stringify(obj, null, 2);
        } catch (error) {
            console.error("Beautify error:", error);
            return typeof input === 'string' ? input : JSON.stringify(input);
        }
    };




    return (
        <>
            {((type === 'image_url' || type === 'image') && openImageModal && selectedImage) && <div className='image_url-modal-cont' onClick={(e) => { e.stopPropagation(); setOpenImageModal(false) }}>
                <Image src={selectedImage} alt={'user-image'} width={5024} height={5024} className='image_url-modal' onClick={(e) => { e.stopPropagation(); }} />
            </div>
            }
            <div ref={containerRef}
                className='user-chat-msg-cont'
                onClick={() => { setOpenImageModal(false) }}
            >


                {type === 'file' && <div>
                    <FilePreview fileName={filename ?? ''} fileUrl={content} show={true} />
                </div>}

                {!(type === 'event') && <div
                    style={{
                        display: 'flex',
                        flexDirection: role === 'user' ? 'row-reverse' : 'row', // Align user messages to the right, AI messages to the left
                        alignItems: 'flex-end', // Align items to the bottom
                        maxWidth: '70%', // Limit the width of the message container
                        background: 'transparent',
                    }}
                >
                    {/* Message Bubble */}
                    {(type === 'image_url' && role === 'user') && <div className='chat-image_url-cont' >
                        <img src={content} alt={'user-image'} width={1024} height={1024} className='chat-image_url-cont' />
                    </div>
                    }
                    <div
                        ref={messageRef}
                        className='user-msg-cont'
                    >


                        {type === 'text' && <div className='user-msg-box'  >

                            <Markdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex, [rehypeExternalLinks, { target: '_blank', rel: 'noopener noreferrer' }]]}
                                // @ts-ignore
                                components={{
                                    a: renderLink,
                                    code: renderCode,
                                    img: renderImage,
                                    ul: ({ children }) => (
                                        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>{children}</ul>
                                    ),
                                    li: ({ children }) => (
                                        <li style={{ marginBottom: '6px' }}>{children}</li>
                                    ),
                                    p: ({ children, ...props }) => {
                                        const hasImage = React.Children.toArray(children).some(
                                            (child) => React.isValidElement(child) && child.type === renderImage
                                        );
                                        return hasImage ? <div {...props}>{children}</div> : <p style={{ margin: "8px 0", fontWeight: 'normal' }} {...props}>{children}</p>;
                                    },
                                    h1: ({ children }) => <h1 style={{ fontSize: '24px', margin: '16px 0' }}>{children}</h1>,
                                    h2: ({ children }) => <h2 style={{ fontSize: '20px', margin: '14px 0' }}>{children}</h2>,
                                    h3: ({ children }) => <h3 style={{ fontSize: '18px', margin: '12px 0' }}>{children}</h3>,
                                    h4: ({ children }) => <h4 style={{ fontSize: '16px', margin: '10px 0' }}>{children}</h4>,
                                    h5: ({ children }) => <h5 style={{ fontSize: '14px', margin: '8px 0' }}>{children}</h5>,
                                    h6: ({ children }) => <h6 style={{ fontSize: '12px', margin: '6px 0' }}>{children}</h6>,
                                    table: ({ children }) => (
                                        <div style={{ overflowX: 'auto', width: '100%', maxHeight: '100%' }}>
                                            <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', margin: '10px 0' }}>
                                                {children}
                                            </table>
                                        </div>
                                    ),
                                    th: ({ children }) => <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: 'transparent' }}>{children}</th>,
                                    td: ({ children }) => <td style={{ border: '1px solid #ddd', padding: '8px' }}>{children}</td>,
                                }}
                            >
                                {content}
                            </Markdown>
                        </div>}
                        {!aiTyping && type === 'text' && (
                            <div className='chat-footer-user'>
                                <button
                                    onClick={() => copyMessageToClipboard(content)}
                                    className='copy-button'
                                    title='copy'
                                >
                                    <Copy size={16} />

                                </button>
                                <button className='copy-button' title='Bad Response' onClick={() => { setEditInput(content) }}><Pencil size={16} /></button>
                            </div>
                        )}


                    </div>
                </div>}

            </div>
        </>
    );
};

export default TextUserMessage;