"use client";
import { useState, useRef, useEffect } from 'react';
import './style.css'

import Image from 'next/image';
import { ArrowUp, CircleStop, Paperclip, Pickaxe, Plus, Server, Settings, Settings2, Wrench, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useChat, useMcpServer } from '@/context/chatContext';
import { useAlert } from '@/context/alertContext';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import { llmModels } from '../../utils/models';
import { MCP } from '@/lib/mcp';
import { deleteFile, uploadFileToServer } from '../../utils/upload-file';
import { Oval } from 'react-loader-spinner';
import FilePreview from './filepreview';
import { ToolChips } from './toolChip';


interface ChatInputProps {
  pause: boolean;
  onStop: () => void;
}

interface FileData {
  id: string; // Add unique identifier for each file
  filename: string;
  file_data?: string;
  file_url?: string;
  type: 'file' | 'image';
  image_url?: string;
}

const ChatInput = () => {
  const { handleSendMessage, aiTyping, abortControllerRef, setAiTyping, messages, editInput, Model, selectModel } = useChat();
  const { selectedServers, mcpResources, mcpTools } = useMcpServer();
  const alert = useAlert();
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]); // Changed to array
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileLoading, setFileLoading] = useState<boolean>(false);
  const [showSearchAds, setShowSearchAds] = useState<boolean>(false);
  const [openAttachModal, setOpenAttachModal] = useState<boolean>(false);
  const router = useRouter()
  const { user } = useAuth();
  const { theme } = useTheme();
  const alertMessage = useAlert()
  const pathname = usePathname();
  const [openSettingsModal, setSettingsModal] = useState(false);
  const [openSelectMcpModal, setSelectMcpModal] = useState(false);
  const [openSelectToolModal, setSelectToolModal] = useState(false);
  const [showToolsBtn, setShowToolsBtn] = useState(false);
  const [fileName, setFileName] = useState<any[]>([])


  useEffect(() => {
    const matchedModel = llmModels.find(m => m.value === Model);
    setShowToolsBtn(!!matchedModel?.tools);
  }, [Model]);

  // console.log(editInput)
  // Adjust textarea height dynamically
  useEffect(() => {
    if (editInput) {
      setInput(editInput);
    }

  }, [editInput]);
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '50px'; // Reset height
      textarea.style.height = `${Math.max(textarea.scrollHeight, 50)}px`; // Set height based on content
    }

  }, [input]);

  // Convert file to base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:mime/type;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Check if file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Generate unique ID for files
  const generateFileId = (): string => {
    return Date.now().toString() + Math.random().toString(36);
  };
  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
  ];
  // Handle multiple file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileLoading(true);
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (!(file.type.startsWith("image/") || allowedTypes.includes(file.type))) {
        alertMessage.warn(`${file.name} is not a supported readable file.`);
        setFileLoading(false);
        return;
      }
    }
    if (files.length + selectedFiles.length > 2) {
      alert.warn('files not mre than 2');
      return
    };
    if (files.length === 0) return;

    const newFiles: FileData[] = [];

    try {
      for (const file of files) {
        const isImage = isImageFile(file);

        // Upload the file to server
        const uploadResponse = await uploadFileToServer(file, user?.uid ?? '');

        const fileData: FileData = {
          id: generateFileId(),
          filename: file.name,
          file_data: '',
          file_url: uploadResponse?.url || '', // You can use response message or URL
          type: isImage ? 'image' : 'file',
        };
        const d = {
          id: fileData.id,
          storedName: uploadResponse.storedName
        }
        setFileName(prev => [...prev, d])

        if (isImage) {
          fileData.image_url = uploadResponse?.url; // assuming server returns uploaded image URL
        }
        console.log(fileData)
        newFiles.push(fileData);
      }

      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    } catch (error) {
      alertMessage.warn('Please try again.');
      console.error('Error uploading files:', error);
    } finally {
      setFileLoading(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  // Remove specific file by ID
  const removeSelectedFile = (fileId: string) => {
    console.log(fileId)
    const file = fileName.find(f => f.id === fileId);
    console.log(file, fileName)
    if (file) {
      console.log(file, fileName);
      deleteFile(file.storedName);
    } else {
      console.warn("File not found for id:", fileId);
    }

    setSelectedFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
    setFileName(prev => prev.filter(file => file.id !== fileId))
  };

  // Clear all selected files
  // Clear all selected files
  const clearAllFiles = () => {
    // delete all on backend first
    fileName.forEach(f => {
      deleteFile(f.storedName);
    });

    // then clear local state
    setSelectedFiles([]);
    setFileName([]);
  };


  const handleMcpResources = async (r: any) => {
    const newFiles: FileData[] = [];

    try {
      const endpoints = selectedServers.map((server: any) => ({
        uri: server.uri,
        authKey: server.authKey
      }));

      const connectionResults = await Promise.all(
        endpoints.map(endpoint => MCP(endpoint))
      );

      const tools = connectionResults.flatMap(result => result.tools);
      const resources = connectionResults.flatMap(result => result.resources);

      // Early return if no tools or resources found
      if (!resources || resources.length === 0) {
        alertMessage.warn('No resources found.');
        return;
      }

      // Map resources to ensure they match McpResource type
      const mappedResources = resources.map((resource: any) => ({
        uri: resource.uri,
        name: resource.name,
        ...resource // spread other properties
      }));

      // console.log('Mapped resources:', mappedResources);

      // Filter connections that have resources
      const clientsWithResources = connectionResults
        .filter(({ resources }) =>
          Array.isArray(resources) &&
          resources.length > 0
        )
        .map(({ mcpClient }) => mcpClient)
        .filter(client => client !== null); // Filter out null clients immediately

      //  console.log('Clients with resources:', clientsWithResources);

      if (clientsWithResources.length === 0) {
        alertMessage.warn("No valid clients available to call the resources.");
        // console.warn("No valid clients available to call the tool.");
        return;
      }

      // Use the first available resource
      const firstResource = r;
      if (!firstResource?.uri || !firstResource?.name) {
        // console.warn("First resource is missing required properties (uri or name).");
        return;
      }

      // Read resources using Promise.any with proper error handling
      const result = await Promise.any(
        clientsWithResources.map(client =>
          client.readResource({
            uri: firstResource.uri,
            name: firstResource.name
          }).then(result => ({
            success: true,
            data: result as unknown as { contents: { text: string }[] }
          }))
            .catch(error => {
              alertMessage.warn('Failed to read resource: ');
              throw error; // Re-throw to be handled by Promise.any
            })
        )
      );

      // console.log('Read resource result:', result);

      // Validate result structure
      if (!result?.data?.contents[0]?.text) {
        alertMessage.warn('Resource data is empty or invalid.');
        return;
      }

      const fileData: FileData = {
        id: generateFileId(),
        filename: r.name || 'unknown_resource',
        file_data: result.data.contents[0].text,
        file_url: '',
        type: 'file',
      };

      newFiles.push(fileData);
      setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);

    } catch (error) {
      alertMessage.warn('Failed to read resource. Please try again.');

      // Handle specific Promise.any rejection
      if (error instanceof AggregateError) {
        alertMessage.warn('Failed to read resource from all clients.');
      }
    }
  };

  // Handle form submission
  const handleSubmit = async () => {

    const c = llmModels.find(m => m.value === Model);

    if (aiTyping) return;
    if (input.trim() || selectedFiles.length > 0) {
      // Prepare message data
      const messageData: MessageContentItem[] = [];

      // Add all selected files/images
      selectedFiles.forEach(file => {
        if (file.type === 'image') {
          messageData.push({
            type: 'image_url',
            image_url: file.image_url!
          });
        } else {
          messageData.push({
            type: 'file',
            file: {
              filename: file.filename,
              file_data: file.file_data,
              file_url: file.file_url
            }
          });
        }
      });

      // Add text data if present
      if (input.trim()) {
        messageData.push({
          type: 'text',
          text: input.trim()
        });
      }

      handleSendMessage(messageData, selectedServers.map(server => server.sid), mcpTools, false);

      setInput('');
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    }
  };
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  // Handle keydown events (e.g., pressing Enter)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMobile) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Prevent default behavior (new line)

        const c = llmModels.find(m => m.value === Model);
        if (aiTyping) return; // Prevent sending messages while AI is typing
        if (input.trim() || selectedFiles.length > 0) {
          // Prepare message data
          const messageData: MessageContentItem[] = [];

          // Add all selected files/images
          selectedFiles.forEach(file => {
            if (file.type === 'image') {
              messageData.push({
                type: 'image_url',
                image_url: file.image_url!
              });
            } else {
              messageData.push({
                type: 'file',
                file: {
                  filename: file.filename,
                  file_data: file.file_data,
                  file_url: file.file_url
                }
              });
            }
          });

          // Add text data if present
          if (input.trim()) {
            messageData.push({
              type: 'text',
              text: input.trim()
            });
          }

          handleSendMessage(messageData, selectedServers.map(server => server.sid), mcpTools, false);
          setInput('');
          setSelectedFiles([]);
          if (textareaRef.current) {
            textareaRef.current.blur();
          }
        }
      }
    }

  };

  // Handle stop button click
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Abort the ongoing request
    }
  };
  const attachModalRef = useRef<HTMLDivElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (
        openAttachModal &&
        attachModalRef.current &&
        attachButtonRef.current &&
        !attachModalRef.current.contains(event.target) &&
        !attachButtonRef.current.contains(event.target)
      ) {
        setOpenAttachModal(false);
      }
    };

    if (openAttachModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openAttachModal, setOpenAttachModal]);
  return (
    <>
      <div className='input-body'>
        <div
          className='input-container' onClick={(e) => {
            setOpenAttachModal(false);
            e.stopPropagation();
          }}

        >
          <ToolChips />
          {/* Multiple files preview */}
          {fileLoading && <div className="files-preview-cont"> <div className='file-view' > <Oval
            visible={true}
            height="24"
            width="24"
            color="white"
            ariaLabel="oval-loading"
            wrapperStyle={{}}
            strokeWidth={4}
            wrapperClass=""
            secondaryColor="white"
          /></div></div>}
          {selectedFiles.length > 0 && (
            <div className="files-preview-cont">

              {/* Files grid */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',

                gap: '8px',
                maxWidth: '600px',
                maxHeight: '100px',
                objectFit: 'contain',
              }}>
                {selectedFiles.map((file) => (
                  <div key={file.id} className="file-preview" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px',
                    borderRadius: '8px',
                    position: 'relative',
                    fontSize: '12px',
                    objectFit: 'cover',
                  }}>
                    {/* Remove button */}
                    <button
                      onClick={() => removeSelectedFile(file.id)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        background: theme === 'dark' ? 'black' : 'white'
                      }}
                    >
                      <X size={12} />
                    </button>

                    {/* File content */}
                    {file.type === 'image' && file.image_url ? (
                      <img
                        src={file.image_url}
                        alt={file.filename}
                        style={{
                          width: '50px',
                          height: '50px',
                          objectFit: 'fill',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <div className='file-view' >
                        {fileLoading ? 'Loading...' : (
                          <div>
                            <FilePreview
                              show={false}
                              fileName={file.filename}
                              fileUrl={file.file_url || file.file_data || ''}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Filename */}
                    {/* <div style={{
                      width: '100%',
                      textAlign: 'center',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '11px'
                    }}>
                      {file.filename}
                    </div> */}
                  </div>
                ))}
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'Ask Anything'}
            onKeyDown={handleKeyDown}
            className='textarea'
            onFocus={() => setShowSearchAds(true)}
            onBlur={() => setShowSearchAds(false)}
          />
          <div className='input-btn-cont'>
            <div className='input-btn-cont-left'>
              <button className="attach-btn" ref={attachButtonRef} onClick={(e) => {
                e.stopPropagation();
                setOpenAttachModal(!openAttachModal);
              }}>

                <Plus size={20} />
              </button>
              {!(pathname.includes('/agent')) && <button className='server-btn' onClick={() => { setSettingsModal(!openSettingsModal) }}><Settings size={18} /></button>}
            </div>



            <div className='input-btn-cont-right'>
              <button className='server-btn' onClick={() => { window.location.hash = '#tools' }}><Settings2 size={18} /></button>
              {!(aiTyping) && <button
                className='button-send send'
                onClick={handleSubmit}
              >
                <ArrowUp />
              </button>}
              {(aiTyping) && (
                <button
                  type="button"
                  onClick={handleStop}
                  className='stop-button'
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <rect x="7" y="7" width="10" height="10" rx="2" />
                  </svg>
                </button>)}
            </div>
          </div>
          {openAttachModal && <div className='attach-btn-modal' ref={attachModalRef} onClick={(e) => { e.stopPropagation() }}>
            <button
              className="attach-child-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              upload file & photos
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={(e) => {
                  handleFileSelect(e);       // your upload logic
                  setOpenAttachModal(false); // close modal after selection
                }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                multiple
              />
            </button>
            <hr />
            <label>mcp resources</label>
            {mcpResources.map((resource) => (
              <button
                key={resource.uri}
                className="attach-child-btn"
                onClick={() => {
                  handleMcpResources(resource);
                }}

              >
                <Pickaxe size={16} /> {resource.name}
              </button>
            ))}
          </div>}
        </div>
      </div>

    </>
  );
};

export default ChatInput;