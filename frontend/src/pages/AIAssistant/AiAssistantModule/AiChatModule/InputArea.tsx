import StrictModeTooltip from '@/components/StrictModeTooltip';
import useLanguage from '@/locale/useLanguage';
import {
  AudioOutlined,
  DeleteOutlined,
  FileOutlined,
  LoadingOutlined,
  PaperClipOutlined,
  SendOutlined,
} from '@/components/icons';
import { Alert, Button, Col, Input, Progress, Row, Space, Tag, Upload } from '@/components/ui';
import { useRef, useState } from 'react';
import EmojiPicker from './EmojiPicker';

const { TextArea } = Input;

const InputArea = ({ onSendMessage, disabled, placeholder }) => {
  const translate = useLanguage();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const textAreaRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const handleSend = () => {
    if ((message.trim() || attachedFiles.length > 0) && !disabled) {
      const messageData = {
        text: message,
        files: attachedFiles,
      };
      onSendMessage(messageData);
      setMessage('');
      setAttachedFiles([]);
      setUploadProgress({});
      textAreaRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    const textarea = textAreaRef.current;
    if (textarea) {
      const start = textarea.resizableTextArea.textArea.selectionStart;
      const end = textarea.resizableTextArea.textArea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Focus back to textarea and set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        const newCursorPosition = start + emoji.length;
        textarea.resizableTextArea.textArea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      setMessage((prev) => prev + emoji);
    }
  };

  const handleFileUpload = (file) => {
    const fileId = Date.now() + '_' + file.name;

    // Add file to attached files with loading state
    const newFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
      uploading: true,
    };

    setAttachedFiles((prev) => [...prev, newFile]);
    setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

    // Simulate file upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const currentProgress = prev[fileId] || 0;
        const newProgress = Math.min(currentProgress + Math.random() * 30, 100);

        if (newProgress >= 100) {
          clearInterval(uploadInterval);
          // Mark file as uploaded
          setAttachedFiles((prevFiles) =>
            prevFiles.map((f) => (f.id === fileId ? { ...f, uploading: false, uploaded: true } : f))
          );
          return { ...prev, [fileId]: 100 };
        }

        return { ...prev, [fileId]: newProgress };
      });
    }, 200);

    return false; // Prevent default upload
  };

  const removeFile = (fileId) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      mediaRecorder.start();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Handle recorded audio data
          const audioBlob = new Blob([event.data], { type: 'audio/wav' });
          const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, {
            type: 'audio/wav',
          });
          handleFileUpload(audioFile);
        }
      };
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(translate('Microphone access denied or not available'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      clearInterval(recordingIntervalRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      style={{
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        border: '1px solid #d9d9d9',
        padding: '8px',
      }}
    >
      {/* Recording Indicator */}
      {isRecording && (
        <Alert
          message={
            <Space>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#ff4d4f',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite',
                }}
              />
              {translate('Recording')} - {formatTime(recordingTime)}
              <Button size="small" type="link" onClick={stopRecording}>
                {translate('Stop')}
              </Button>
            </Space>
          }
          type="info"
          style={{ marginBottom: '8px', padding: '4px 8px' }}
          showIcon={false}
        />
      )}

      {/* Attached Files */}
      {attachedFiles.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <Space wrap size={[4, 4]}>
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  minWidth: '200px',
                }}
              >
                <Row align="middle" justify="space-between">
                  <Col flex="auto">
                    <Space size={4}>
                      {file.uploading ? (
                        <LoadingOutlined spin style={{ color: '#1890ff' }} />
                      ) : (
                        <FileOutlined style={{ color: '#1890ff' }} />
                      )}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{file.name}</div>
                        <div style={{ fontSize: '10px', color: '#666' }}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </Space>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => removeFile(file.id)}
                      style={{ color: '#ff4d4f', padding: '2px' }}
                    />
                  </Col>
                </Row>

                {file.uploading && (
                  <Progress
                    percent={Math.round(uploadProgress[file.id] || 0)}
                    size="small"
                    showInfo={false}
                    style={{ marginTop: '4px' }}
                  />
                )}

                {file.uploaded && (
                  <Tag size="small" color="success" style={{ marginTop: '4px', fontSize: '10px' }}>
                    {translate('Uploaded')}
                  </Tag>
                )}
              </div>
            ))}
          </Space>
        </div>
      )}

      <Row align="middle" gutter={8}>
        <Col flex="auto">
          <TextArea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={disabled}
            variant="borderless"
            style={{
              backgroundColor: 'transparent',
              resize: 'none',
            }}
          />
        </Col>

        <Col>
          <Space size={4}>
            <StrictModeTooltip title={translate('Add emoji')}>
              <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
            </StrictModeTooltip>

            <StrictModeTooltip title={translate('Attach file')}>
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.wav"
                multiple
              >
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  disabled={disabled}
                  size="small"
                  style={{
                    color: attachedFiles.length > 0 ? '#1890ff' : '#666',
                    backgroundColor: attachedFiles.length > 0 ? '#f0f7ff' : 'transparent',
                  }}
                />
              </Upload>
            </StrictModeTooltip>

            <StrictModeTooltip
              title={isRecording ? translate('Stop recording') : translate('Start voice recording')}
            >
              <Button
                type="text"
                icon={<AudioOutlined />}
                onClick={toggleRecording}
                disabled={disabled}
                size="small"
                style={{
                  color: isRecording ? '#ff4d4f' : '#666',
                  backgroundColor: isRecording ? '#fff2f0' : 'transparent',
                  animation: isRecording ? 'pulse 1.5s infinite' : 'none',
                }}
              />
            </StrictModeTooltip>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={disabled || (!message.trim() && attachedFiles.length === 0)}
              size="small"
              style={{
                borderRadius: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Space>
        </Col>
      </Row>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default InputArea;
