/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Camera, 
  FileText, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  ChefHat, 
  Users, 
  Clock, 
  Activity, 
  Utensils,
  RefreshCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeIngredientsAndSuggest, UserPreferences } from './services/geminiService.ts';
import { cn } from './lib/utils.ts';

type Step = 'input' | 'preferences' | 'analyzing' | 'suggestions';

export default function App() {
  const [step, setStep] = useState<Step>('input');
  const [images, setImages] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>({
    peopleCount: '',
    dietaryNeeds: '',
    timeLimit: '',
    skillLevel: '',
    mood: ''
  });
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const startAnalysis = async () => {
    setIsAnalyzing(true);
    setStep('analyzing');
    setError(null);
    try {
      const result = await analyzeIngredientsAndSuggest(
        { text: textInput, images },
        preferences
      );
      setAnalysisResult(result || "I couldn't generate suggestions. Please try again.");
      setStep('suggestions');
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong while talking to the Fridge Chef. Please check your connection or try a different photo.");
      setStep('input');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setStep('input');
    setImages([]);
    setTextInput('');
    setAnalysisResult(null);
    setError(null);
  };

  const nextStep = () => {
    if (step === 'input') {
      if (images.length === 0 && !textInput.trim()) {
        setError("Please add at least one photo or some text.");
        setTimeout(() => setError(null), 3000);
        return;
      }
      setStep('preferences');
    } else if (step === 'preferences') {
      startAnalysis();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[var(--bg-header)] border-b border-[var(--border-beige)] py-6 px-8 flex justify-between items-center mb-8 md:mb-12"
      >
        <div className="flex items-center gap-2">
          <ChefHat className="text-[var(--accent-forest)] w-8 h-8" />
          <h1 className="text-3xl font-serif font-bold text-[var(--accent-forest)] italic">Fridge Chef</h1>
        </div>
        <div className="hidden md:block text-xs uppercase tracking-widest font-bold text-[var(--text-muted)]">
          Sustainable Cooking Helper
        </div>
      </motion.header>

      <main className="w-full flex-grow flex flex-col">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 bg-[var(--bg-panel)] p-6 md:p-10 rounded-[32px] border border-[var(--border-beige)]"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-[2px] text-[var(--accent-earth)] uppercase">Your Inventory</span>
                <h2 className="text-3xl font-serif font-bold text-[var(--accent-forest)]">What's in your kitchen?</h2>
                <p className="text-[var(--text-muted)]">
                  Snap a photo of your fridge, pantry, or counter. Or just type a list.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Photo Upload area */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-2 border-dashed border-[var(--border-beige)] rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[var(--accent-forest)] hover:bg-stone-50 transition-all group"
                >
                  <div className="w-14 h-14 bg-[var(--bg-warm)] rounded-full flex items-center justify-center group-hover:bg-[var(--accent-forest)] group-hover:text-white transition-colors">
                    <Camera className="w-7 h-7" />
                  </div>
                  <span className="font-semibold text-sm">Upload Fridge Photos</span>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>

                {/* Text input area */}
                <div className="relative">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="E.g., 3 eggs, half an onion, bit of spinach..."
                    className="w-full h-full min-h-[180px] p-5 rounded-2xl border border-[var(--border-beige)] focus:border-[var(--accent-forest)] focus:outline-none resize-none bg-white shadow-sm"
                  />
                  <div className="absolute top-5 right-5 text-stone-300">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Image Preview */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative group w-28 h-28 shadow-sm">
                      <img src={img} alt="Preview" className="w-full h-full object-cover rounded-2xl border border-[var(--border-beige)]" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button 
                onClick={nextStep}
                className="w-full bg-[var(--accent-earth)] text-white font-bold py-5 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-stone-200 uppercase tracking-widest text-sm"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Preferences */}
          {step === 'preferences' && (
            <motion.div 
              key="preferences"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 bg-[var(--bg-panel)] p-6 md:p-10 rounded-[32px] border border-[var(--border-beige)]"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-[2px] text-[var(--accent-earth)] uppercase">Cooking Profile</span>
                <h2 className="text-3xl font-serif font-bold text-[var(--accent-forest)]">Help me refine the ideas...</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Users className="w-3 h-3" /> Group Size
                  </label>
                  <input 
                    type="text" 
                    placeholder="E.g., 2 adults"
                    className="w-full p-4 rounded-xl border border-[var(--border-beige)] focus:border-[var(--accent-forest)] focus:outline-none bg-white shadow-sm"
                    value={preferences.peopleCount}
                    onChange={(e) => setPreferences({...preferences, peopleCount: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Activity className="w-3 h-3" /> Dietary Needs
                  </label>
                  <input 
                    type="text" 
                    placeholder="E.g., Vegetarian"
                    className="w-full p-4 rounded-xl border border-[var(--border-beige)] focus:border-[var(--accent-forest)] focus:outline-none bg-white shadow-sm"
                    value={preferences.dietaryNeeds}
                    onChange={(e) => setPreferences({...preferences, dietaryNeeds: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Clock className="w-3 h-3" /> Prep Time
                  </label>
                  <select 
                    className="w-full p-4 rounded-xl border border-[var(--border-beige)] focus:border-[var(--accent-forest)] focus:outline-none bg-white shadow-sm"
                    value={preferences.timeLimit}
                    onChange={(e) => setPreferences({...preferences, timeLimit: e.target.value})}
                  >
                    <option value="">Any time</option>
                    <option value="15 min">Under 15 min</option>
                    <option value="30 min">About 30 min</option>
                    <option value="60 min">Up to an hour</option>
                    <option value="meal prep">Meal prep</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Sparkles className="w-3 h-3" /> Skill Level
                  </label>
                  <div className="flex gap-2">
                    {['Beginner', 'Intermediate', 'Confident'].map(skill => (
                      <button
                        key={skill}
                        onClick={() => setPreferences({...preferences, skillLevel: skill})}
                        className={cn(
                          "flex-1 py-4 px-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all",
                          preferences.skillLevel === skill 
                            ? "bg-[var(--accent-forest)] text-white border-[var(--accent-forest)] shadow-md" 
                            : "bg-white border-[var(--border-beige)] hover:border-stone-300 shadow-sm"
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    <Utensils className="w-3 h-3" /> Mood Preference
                  </label>
                  <input 
                    type="text" 
                    placeholder="E.g., Italian, something light, or 'surprise me'"
                    className="w-full p-4 rounded-xl border border-[var(--border-beige)] focus:border-[var(--accent-forest)] focus:outline-none bg-white shadow-sm"
                    value={preferences.mood}
                    onChange={(e) => setPreferences({...preferences, mood: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setStep('input')}
                  className="flex-shrink-0 border border-[var(--border-beige)] px-8 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={startAnalysis}
                  className="flex-grow bg-[var(--accent-forest)] text-white font-bold py-5 rounded-full flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-stone-200 uppercase tracking-widest text-sm"
                >
                  Generate Ideas <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Analyzing */}
          {step === 'analyzing' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-grow flex flex-col items-center justify-center py-20 text-center space-y-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--accent-olive)] opacity-20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-[var(--accent-olive)] animate-spin relative z-10" />
              </div>
              <div className="space-y-2 relative z-10">
                <h2 className="text-2xl font-serif font-bold italic">Cooking up ideas...</h2>
                <div className="flex flex-col gap-1 text-[var(--text-muted)] animate-pulse">
                  <span>Identifying ingredients...</span>
                  <span>Checking for soon-to-spoil items...</span>
                  <span>Finding balanced meals...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Suggestions */}
          {step === 'suggestions' && (
            <motion.div 
              key="suggestions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-8 pb-12"
            >
              <div className="flex items-center justify-between bg-[var(--bg-panel)] p-6 rounded-[24px] border border-[var(--border-beige)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--accent-forest)]/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-[var(--accent-forest)] w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-[2px] text-[var(--accent-earth)] uppercase">Chef's Picks</span>
                    <h3 className="font-serif font-bold text-xl text-[var(--accent-forest)]">Rescue Recipes</h3>
                  </div>
                </div>
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-earth)] hover:opacity-80 border-b border-[var(--accent-earth)]"
                >
                  <RefreshCcw className="w-4 h-4" /> Reset
                </button>
              </div>

              <div className="space-y-6">
                <ReactMarkdown
                  components={{
                    h2: ({node, ...props}) => <h2 className="text-2xl font-serif font-bold text-[var(--accent-forest)] mt-8 mb-4 border-b border-[var(--border-beige)] pb-2" {...props} />,
                    strong: ({node, ...props}) => <strong className="text-[var(--accent-earth)] font-bold italic" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-none pl-0 space-y-6" {...props} />,
                    li: ({node, ...props}) => {
                      if (props.children?.toString().startsWith('**')) {
                         return <li className="bg-white p-8 rounded-[24px] border border-[var(--border-beige)] shadow-[0_4px_12px_rgba(0,0,0,0.03)]" {...props} />
                      }
                      return <li className="flex items-start gap-3 mb-2" {...props} />
                    },
                  }}
                >
                  {analysisResult || ''}
                </ReactMarkdown>
              </div>

              <div className="bg-[var(--accent-forest)] p-10 rounded-[32px] text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-[-30px] top-[-30px] opacity-10">
                  <ChefHat className="w-56 h-56 rotate-12" />
                </div>
                <div className="relative z-10 space-y-6">
                  <div>
                    <span className="text-[10px] font-bold tracking-[3px] text-white/60 uppercase block mb-2">Need More Help?</span>
                    <h3 className="text-3xl font-serif font-bold italic">Ask me anything...</h3>
                  </div>
                  <p className="text-white/80 max-w-md text-sm leading-relaxed">
                    I can expand any of these into full recipes with exact measurements, or give you a grouped shopping list for anything missing.
                  </p>
                  
                  <div className="flex gap-2 group">
                    <input 
                      type="text" 
                      placeholder="e.g., 'Full recipe for the Zesty Pasta'"
                      className="flex-grow bg-white/10 border border-white/20 rounded-full px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const val = e.currentTarget.value;
                          if (!val) return;
                          setIsAnalyzing(true);
                          setStep('analyzing');
                          try {
                            const result = await analyzeIngredientsAndSuggest(
                              { text: `Follow up context: ${analysisResult}. User question: ${val}` },
                              preferences
                            );
                            setAnalysisResult(result);
                            setStep('suggestions');
                          } catch (err) {
                            setError("Couldn't get an answer. Try again?");
                            setStep('suggestions');
                          } finally {
                            setIsAnalyzing(false);
                          }
                        }
                      }}
                    />
                    <button className="bg-[var(--accent-earth)] text-white p-4 rounded-full font-bold hover:opacity-90 transition-all shadow-lg">
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistence Tip */}
      {step === 'suggestions' && (
        <footer className="mt-8 text-center text-sm text-[var(--text-muted)] italic">
          "Save this chat — next time you cook, snap a new fridge photo and I'll do this again."
        </footer>
      )}
    </div>
  );
}
