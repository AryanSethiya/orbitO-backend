import fs from 'fs';
import path from 'path';

const root = '/Users/aryan.sethiya/Desktop/orbitO frontend';

// Update App.tsx with exact response mapping for submitGuess
const appFile = path.join(root, 'src/App.tsx');
let appContent = fs.readFileSync(appFile, 'utf8');

const oldHandleGuess = `  const handleSubmitGuess = async (word: string) => {
    if (!sessionId) return;
    try {
      setLoadingGuess(true);
      const res = await ApiClient.submitGuess(sessionId, word);
      
      const newGuess: Guess = {
        id: res.guess.id,
        word: res.guess.word,
        rank: res.guess.rank,
        similarityScore: res.guess.similarityScore,
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };

      setGuesses((prev) => [...prev, newGuess]);
      setCurrentScore(res.session.score);

      if (res.session.solved) {
        setSolved(true);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err.message);
    } finally {
      setLoadingGuess(false);
    }
  };`;

const newHandleGuess = `  const handleSubmitGuess = async (word: string) => {
    if (!sessionId) return;
    try {
      setLoadingGuess(true);
      const res: any = await ApiClient.submitGuess(sessionId, word);
      
      const newGuess: Guess = {
        word: res.word || word,
        rank: res.rank || 500,
        similarityScore: res.semanticScore !== undefined ? res.semanticScore : (res.similarityScore || 0.5),
        scoreDelta: -5,
        createdAt: new Date().toISOString(),
      };

      setGuesses((prev) => [...prev, newGuess]);
      if (res.scoreBreakdown?.finalScore !== undefined) {
        setCurrentScore(res.scoreBreakdown.finalScore);
      } else {
        setCurrentScore((prev) => Math.max(0, prev - 5));
      }

      if (res.isSolved || res.rank === 1) {
        setSolved(true);
        setIsSolvedOpen(true);
      }
    } catch (err: any) {
      console.warn('Guess error:', err.message);
    } finally {
      setLoadingGuess(false);
    }
  };`;

if (appContent.includes(oldHandleGuess)) {
  appContent = appContent.replace(oldHandleGuess, newHandleGuess);
} else {
  // Replace the entire handleSubmitGuess block
  appContent = appContent.replace(/const handleSubmitGuess = async[\s\S]*?finally \{[\s\S]*?setLoadingGuess\(false\);[\s\S]*?\};/, newHandleGuess.trim());
}

fs.writeFileSync(appFile, appContent);
console.log('✅ Updated App.tsx with robust submitGuess payload mapping!');
