import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Settings, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Loader2, 
  X,
  Sparkles,
  Info,
  Github,
  ExternalLink
} from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hfToken, setHfToken] = useState<string>(() => localStorage.getItem('hf_token') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedImages = localStorage.getItem('generated_images');
    if (savedImages) {
      try {
        setImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to parse saved images', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('generated_images', JSON.stringify(images));
  }, [images]);

  // Enhanced scrolling to bottom
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [images, isLoading]);

  const saveToken = (token: string) => {
    setHfToken(token);
    localStorage.setItem('hf_token', token);
    setShowSettings(false);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your entire generation history?')) {
      setImages([]);
      localStorage.removeItem('generated_images');
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    if (!hfToken) {
      setShowSettings(true);
      setError('Please provide a Hugging Face API token first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://router.huggingface.co/nscale/v1/images/generations",
        {
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            response_format: "b64_json",
            prompt: prompt,
            model: "stabilityai/stable-diffusion-xl-base-1.0",
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].b64_json) {
        const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: imageUrl,
          prompt: prompt,
          timestamp: Date.now(),
        };
        setImages(prev => [...prev, newImage]);
        setPrompt('');
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while generating the image.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const downloadImage = (url: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `neo-gen-${prompt.slice(0, 20).replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r-4 border-black p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-[#ff6b6b] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase">Neo-Gen</h1>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold uppercase text-gray-500 tracking-widest">History</div>
            {images.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-[10px] font-black uppercase text-[#ff6b6b] hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          {images.length === 0 ? (
            <div className="text-sm text-gray-400 italic">No history yet...</div>
          ) : (
            images.slice().reverse().map(img => (
              <button 
                key={img.id}
                onClick={() => {
                  const el = document.getElementById(`img-${img.id}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full text-left p-3 border-2 border-black hover:bg-[#a3e635] transition-colors truncate text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                {img.prompt}
              </button>
            ))
          )}
        </div>

        <div className="mt-auto pt-6 border-t-2 border-black space-y-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center gap-3 p-3 font-bold hover:bg-[#ffd93d] transition-colors border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Header - Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#ff6b6b]" />
            <span className="font-black uppercase">Neo-Gen</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowHistory(true)}
              className="p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#a3e635]"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat/Gallery Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth"
        >
          {images.length === 0 && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
              <div className="w-24 h-24 bg-[#ffd93d] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center rotate-3">
                <ImageIcon className="w-12 h-12" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
                Imagine <span className="bg-[#a3e635] px-2">Anything</span>
              </h2>
              <p className="text-xl font-bold text-gray-600">
                Type a prompt below to generate high-quality images using Stable Diffusion XL.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {['A cyberpunk city in rain', 'An oil painting of a cat astronaut', 'Vibrant synthwave landscape', 'Minimalist architectural sketch'].map(suggestion => (
                  <button 
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="p-4 border-4 border-black font-bold hover:bg-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence>
            {images.map((img) => (
              <motion.div 
                key={img.id}
                id={`img-${img.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="neo-card overflow-hidden">
                  <div className="bg-black text-white p-3 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest truncate mr-4">Prompt: {img.prompt}</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => downloadImage(img.url, img.prompt)}
                        title="Download Image"
                        className="p-2 bg-[#a3e635] text-black border-2 border-white hover:bg-white transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteImage(img.id)}
                        title="Delete Image"
                        className="p-2 bg-[#ff6b6b] text-black border-2 border-white hover:bg-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="relative group">
                    <img 
                      src={img.url} 
                      alt={img.prompt}
                      className="w-full h-auto object-contain bg-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => downloadImage(img.url, img.prompt)}
                        className="neo-button flex items-center gap-2 py-2 px-4 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="neo-card p-12 flex flex-col items-center justify-center space-y-4 bg-white/50 backdrop-blur-sm">
                <Loader2 className="w-12 h-12 animate-spin text-[#ff6b6b]" />
                <p className="font-black uppercase tracking-tighter text-xl text-center">Generating your masterpiece...</p>
                <p className="text-gray-500 font-bold">This usually takes 10-20 seconds</p>
              </div>
            </motion.div>
          )}

          {error && (
            <div className="max-w-4xl mx-auto p-4 bg-[#ff6b6b] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold flex items-center gap-3">
              <Info className="w-6 h-6 shrink-0" />
              <p>{error}</p>
              <button onClick={() => setError(null)} className="ml-auto">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Bottom anchor for scrolling */}
          <div ref={bottomRef} className="h-1" />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="neo-card flex items-center p-2 bg-white">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    generateImage();
                  }
                }}
                placeholder="Describe what you want to see..."
                className="flex-1 bg-transparent border-none focus:ring-0 p-4 font-bold text-lg resize-none h-16 max-h-32"
              />
              <button 
                onClick={generateImage}
                disabled={isLoading || !prompt.trim()}
                className="neo-button p-4 flex items-center justify-center ml-2"
              >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile History Modal */}
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-white border-l-4 border-black p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter">History</h2>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1 border-2 border-black hover:bg-[#ff6b6b] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4">
                {images.length === 0 ? (
                  <div className="text-sm text-gray-400 italic">No history yet...</div>
                ) : (
                  images.slice().reverse().map(img => (
                    <button 
                      key={img.id}
                      onClick={() => {
                        const el = document.getElementById(`img-${img.id}`);
                        el?.scrollIntoView({ behavior: 'smooth' });
                        setShowHistory(false);
                      }}
                      className="w-full text-left p-3 border-2 border-black hover:bg-[#a3e635] transition-colors truncate text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      {img.prompt}
                    </button>
                  ))
                )}
              </div>

              {images.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="mt-6 w-full p-3 border-2 border-black bg-[#ff6b6b] font-black uppercase text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                >
                  Clear All History
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md neo-card p-8 bg-white"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-1 border-2 border-black hover:bg-[#ff6b6b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-8 h-8 text-[#ffd93d]" />
                <h2 className="text-2xl font-black uppercase tracking-tighter">Settings</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black uppercase mb-2">Hugging Face Token</label>
                  <input 
                    type="password"
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="hf_..."
                    className="w-full neo-input"
                  />
                  <p className="mt-2 text-xs font-bold text-gray-500">
                    Get your token from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-black inline-flex items-center gap-1">Hugging Face Settings <ExternalLink className="w-3 h-3" /></a>
                  </p>
                </div>

                <div className="p-4 bg-[#ffd93d]/20 border-2 border-black border-dashed">
                  <p className="text-xs font-bold leading-relaxed">
                    Your token is stored locally in your browser. It is only used to make requests to the Hugging Face API.
                  </p>
                </div>

                <button 
                  onClick={() => saveToken(hfToken)}
                  className="w-full neo-button"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
