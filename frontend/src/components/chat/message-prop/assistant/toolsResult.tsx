import React, { JSX, useState, useCallback, useMemo } from 'react';
import {
    ChevronDown, ChevronRight, Eye, EyeOff, Type, Hash, CheckCircle, XCircle,
    List, Braces, Mail, Link, Calendar, Image, Info, ChevronUp, Copy, Download,
    Video, FileAudio, FileText, Table, Rows, Columns, Code, Box, Maximize, Minimize
} from 'lucide-react';
import './tool.css';

// ### Type Definitions ###
interface ToolResultRenderProps {
    content: any;
    initialShowTypes?: boolean;
    initialCompactView?: boolean;
    maxDepth?: number;
}

interface RenderOptions {
    showTypes: boolean;
    compactView: boolean;
    maxDepth: number;
    currentDepth: number;
    parentKey: string;
}

type DataType =
    | 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'table'
    | 'date' | 'url' | 'email' | 'base64-image' | 'video' | 'audio' | 'file'
    | 'html' | 'unknown';

// ### Popup Component for HTML ###
const HtmlPopup = ({ html, onClose }: { html: string; onClose: () => void; }) => {
    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                    <h3>HTML Preview</h3>
                    <button onClick={onClose} className="popup-close-btn" title="Close">
                        &times;
                    </button>
                </div>
                <div className="popup-html-container" dangerouslySetInnerHTML={{ __html: html }} />
            </div>
        </div>
    );
};


// ### Main Component ###
const ToolResultRender: React.FC<ToolResultRenderProps> = ({
    content,
    initialShowTypes = true,
    initialCompactView = false,
    maxDepth = 10
}) => {
    // ### State Management ###
    const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
    const [isRenderVisible, setIsRenderVisible] = useState(true);
    const [showTypes, setShowTypes] = useState(initialShowTypes);
    const [compactView, setCompactView] = useState(initialCompactView);
    const [popupContent, setPopupContent] = useState<string | null>(null); // State for popup
    const [isFullScreen, setIsFullScreen] = useState(false); // State for full screen mode

    // ### Utility Functions ###
    const detectDataType = (value: any): DataType => {
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                const firstKeys = Object.keys(value[0]);
                if (firstKeys.length > 1 && value.every(item => typeof item === 'object' && item !== null && JSON.stringify(Object.keys(item)) === JSON.stringify(firstKeys))) {
                    return 'table';
                }
            }
            return 'array';
        }
        if (typeof value === 'object') return 'object';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'number') return 'number';
        if (typeof value === 'string') {
            if (value.trim().startsWith('<') && value.trim().endsWith('>')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(value, "text/html");
                if (Array.from(doc.body.childNodes).some(node => node.nodeType === 1)) {
                    return 'html';
                }
            }
            if (/\.(mp4|webm|ogv)$/i.test(value)) return 'video';
            if (/\.(mp3|wav|ogg)$/i.test(value)) return 'audio';
            if (/^https?:\/\//.test(value)) return 'url';
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
            if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(value)) return 'email';
            if (value.startsWith('data:image/')) return 'base64-image';
            if (/\.[a-zA-Z0-9]+$/.test(value.split('?')[0])) return 'file';
            return 'string';
        }
        return 'unknown';
    };

    const getTypeIcon = useCallback((type: DataType): JSX.Element => {
        const iconProps = { size: 14, strokeWidth: 1.5 };
        const icons: Record<DataType, JSX.Element> = {
            string: <Type {...iconProps} />, number: <Hash {...iconProps} />,
            boolean: <CheckCircle {...iconProps} />, array: <List {...iconProps} />,
            object: <Box {...iconProps} />, email: <Mail {...iconProps} />,
            url: <Link {...iconProps} />, date: <Calendar {...iconProps} />,
            'base64-image': <Image {...iconProps} />, video: <Video {...iconProps} />,
            audio: <FileAudio {...iconProps} />, file: <FileText {...iconProps} />,
            table: <Table {...iconProps} />, null: <XCircle {...iconProps} />,
            html: <Code {...iconProps} />, unknown: <Info {...iconProps} />,
        };
        return icons[type] ?? <Info {...iconProps} />;
    }, []);

    const copyToClipboard = (value: any) => {
        const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
        navigator.clipboard.writeText(textToCopy).catch(err => console.error("Failed to copy:", err));
    };

    // ### Toggle Handlers ###
    const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

    const toggleAll = (expand: boolean) => {
        const newExpandedState: { [key: string]: boolean } = {};
        const crawl = (data: any, path: string) => {
            const type = detectDataType(data);
            if (type === 'object' || type === 'array' || type === 'table') {
                newExpandedState[path] = expand;
                const entries = Array.isArray(data) ? data.map((_, i) => i) : Object.keys(data);
                entries.forEach(key => crawl(data[key], `${path}-${key}`));
            }
        };
        crawl(content, 'root');
        setExpandedSections(newExpandedState);
    };

    // ### Renderer Components ###
    const renderValue = (value: any, options: RenderOptions): JSX.Element => {
        if (typeof value === 'string') {
            try {
                if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
                    const parsedJson = JSON.parse(value);
                    return renderValue(parsedJson, options);
                }
            } catch (e) {
                // Not valid JSON, proceed as string
            }
        }

        const { currentDepth, parentKey } = options;
        const type = detectDataType(value);
        const uniqueKey = `${parentKey}-${type}-${currentDepth}`;

        if (currentDepth > options.maxDepth) return <span className="depth-limit">...</span>;

        const TypeLabel = options.showTypes && (
            <span className="type-badge">
                {getTypeIcon(type)} <span className="type-text">{type}</span>
            </span>
        );

        const CopyButton = ({ val }: { val: any }) => (
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard(val); }} className="action-button copy-button" title="Copy"><Copy size={12} /></button>
        );

        // Simple Value Renderers
        const simpleRenderers: Partial<Record<DataType, () => JSX.Element>> = {
            'null': () => <div className="value-row"><span className="null-value">null</span><CopyButton val={null} /></div>,
            'boolean': () => <div className="value-row"><span className={`boolean-value ${value ? 'true' : 'false'}`}>{value ? '✅ True' : '❌ False'}</span><CopyButton val={value} /></div>,
            'number': () => <div className="value-row"><span className="number-value">{value}</span><CopyButton val={value} /></div>,
            'date': () => <div className="value-row"><span className="date-value">{new Date(value).toLocaleDateString()}</span><CopyButton val={value} /></div>,
            'email': () => <div className="value-row"><a href={`mailto:${value}`} className="link-value">{value}</a><CopyButton val={value} /></div>,
            'url': () => <div className="value-row"><a href={value} target="_blank" rel="noopener noreferrer" className="link-value">{value}</a><CopyButton val={value} /></div>,
            'video': () => <video src={value} controls className="media-player" />,
            'audio': () => <audio src={value} controls className="media-player" />,
            'base64-image': () => <img src={value} alt="Embedded" className="base64-image" />,
        };

        if (simpleRenderers[type]) {
            return <>{TypeLabel}{simpleRenderers[type]!()}</>;
        }

        if (type === 'html') {
            return (
                <div className="value-row html-placeholder">
                    {TypeLabel}
                    <span className="summary-info">HTML Content</span>
                    <CopyButton val={value} />
                    <button onClick={() => setPopupContent(value)} className="action-button preview-button">
                        <Eye size={14} /> Preview
                    </button>
                </div>
            );
        }

        if (type === 'file') {
            return (
                <div className="file-preview">
                    <FileText size={32} className="file-icon" />
                    <div className="file-info">
                        <span className="file-name" title={String(value).split('/').pop()}>{String(value).split('/').pop()}</span>
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="download-link"><Download size={14} /> Download</a>
                    </div>
                </div>
            );
        }

        if (type === 'string') {
            if (value.length > 150) {
                const isExpanded = expandedSections[uniqueKey] ?? false;
                return (
                    <div className="long-string-wrapper">
                        <div className="value-row">
                            {TypeLabel}
                            <span className="summary-info">{value.length} characters</span>
                            <CopyButton val={value} />
                            <button onClick={() => toggleSection(uniqueKey)} className="action-button" title={isExpanded ? 'Collapse' : 'Expand'}>
                                {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                        {isExpanded && <div className="long-string-content">{value}</div>}
                    </div>
                );
            }
            return <div className="value-row">{TypeLabel}<span className="string-value">"{value}"</span><CopyButton val={value} /></div>;
        }

        // Complex Type Renderers (Object, Array, Table)
        if (type === 'object' || type === 'array' || type === 'table') {
            const isExpanded = expandedSections[uniqueKey] ?? (currentDepth < 1); // Expand first level by default
            const entries = type === 'table' ? value : (type === 'array' ? value.map((v: any, i: number) => [i, v]) : Object.entries(value));
            const childOptions = { ...options, currentDepth: currentDepth + 1 };
            const summaryText = type === 'object' ? `${entries.length} Properties` : (type === 'table' ? `${entries.length} Rows` : `${entries.length} Items`);

            return (
                <div className="collection-wrapper card-view">
                    <div className="collection-header" onClick={() => toggleSection(uniqueKey)}>
                        {TypeLabel}
                        {type === 'object' && <Box size={16} className="collection-icon" />}
                        {type === 'array' && <List size={16} className="collection-icon" />}
                        {type === 'table' && <Table size={16} className="collection-icon" />}
                        <span className="summary-info">{summaryText}</span>
                        <div className="header-actions">
                            <CopyButton val={value} />
                            <button className="action-button expand-button" title={isExpanded ? 'Collapse' : 'Expand'}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        </div>
                    </div>
                    {isExpanded && (
                        <div className={`nested-content ${options.compactView ? 'compact' : ''}`}>
                            {type === 'table' ? (
                                <TableView data={entries} options={childOptions} renderValue={renderValue} />
                            ) : (
                                entries.map(([key, val]: [string | number, any]) => (
                                    <div key={key} className="field-item">
                                        <div className="field-key">{type === 'array' ? `Item ${key}` : String(key).replace(/([A-Z])/g, ' $1')}</div>
                                        <div className="field-value">
                                            {renderValue(val, { ...childOptions, parentKey: `${uniqueKey}-${key}` })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            );
        }

        // Fallback
        return <div className="value-row">{TypeLabel}<span className="fallback-value">{String(value)}</span><CopyButton val={value} /></div>;
    };

    const renderedContent = useMemo(() => {
        return renderValue(content, { showTypes, compactView, maxDepth, currentDepth: 0, parentKey: 'root' });
    }, [content, showTypes, compactView, maxDepth, expandedSections]);


    return (
        <>
            <div className={`tool-result-container ${compactView ? 'compact-mode' : ''} ${isFullScreen ? 'fullscreen' : ''}`}>
                <div className="tool-result-header">
                    <h3 className="tool-result-title">Tool Result</h3>
                    <div className="header-controls">
                        <button onClick={() => toggleAll(true)} title="Expand All"><Rows size={16} /></button>
                        <button onClick={() => toggleAll(false)} title="Collapse All"><Columns size={16} /></button>
                        <button onClick={() => setShowTypes(p => !p)} title="Toggle Types" data-active={showTypes}><Type size={16} /></button>
                        <button onClick={() => setCompactView(p => !p)} title="Compact View" data-active={compactView}><List size={16} /></button>
                        <button onClick={() => setIsFullScreen(p => !p)} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                            {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                        </button>
                        <button onClick={() => setIsRenderVisible(p => !p)} title={isRenderVisible ? 'Hide' : 'Show'}>
                            {isRenderVisible ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                    </div>
                </div>
                {isRenderVisible && <div className="tool-result-content">{renderedContent}</div>}
            </div>
            {popupContent && <HtmlPopup html={popupContent} onClose={() => setPopupContent(null)} />}
        </>
    );
};

// ### Table View Component ###
const TableView = ({ data, options, renderValue }: { data: any[], options: RenderOptions, renderValue: Function }) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);

    return (
        <div className="table-wrapper">
            <table className="result-table">
                <thead>
                    <tr>{headers.map(h => <th key={h}>{h.replace(/([A-Z])/g, ' $1')}</th>)}</tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {headers.map(header => (
                                <td key={`${rowIndex}-${header}`}>
                                    {renderValue(row[header], { ...options, parentKey: `table-${rowIndex}-${header}` })}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ToolResultRender;