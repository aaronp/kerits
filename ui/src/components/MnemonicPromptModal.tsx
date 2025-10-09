import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { createMnemonic, formatMnemonic } from '../lib/mnemonic';

interface MnemonicPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (mnemonic: string, dontPromptAgain: boolean) => void;
  title?: string;
  description?: string;
}

export function MnemonicPromptModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enter Recovery Phrase',
  description = 'Please enter your 24-word recovery phrase to authorize this operation.',
}: MnemonicPromptModalProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [dontPromptAgain, setDontPromptAgain] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Generate a new mnemonic when modal opens
      const newMnemonic = createMnemonic();
      setMnemonic(newMnemonic);
      setDontPromptAgain(false);
      setError('');
    } else {
      // Reset state when modal closes
      setMnemonic('');
      setDontPromptAgain(false);
      setError('');
    }
  }, [isOpen]);

  const handleRefresh = () => {
    const newMnemonic = createMnemonic();
    setMnemonic(newMnemonic);
    setError('');
  };

  const handleSubmit = () => {
    const trimmed = mnemonic.trim();

    if (!trimmed) {
      setError('Recovery phrase is required');
      return;
    }

    // Basic validation: check for 24 words
    const words = trimmed.split(/\s+/);
    if (words.length !== 24) {
      setError(`Expected 24 words, got ${words.length}`);
      return;
    }

    onSubmit(trimmed, dontPromptAgain);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mnemonic">Recovery Phrase (24 words)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="h-8 gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            </div>
            <Textarea
              id="mnemonic"
              placeholder="word1 word2 word3 ..."
              value={formatMnemonic(mnemonic)}
              onChange={(e) => {
                setMnemonic(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              className="font-mono text-sm min-h-[120px]"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="dont-prompt"
              checked={dontPromptAgain}
              onCheckedChange={(checked) => setDontPromptAgain(checked === true)}
            />
            <label
              htmlFor="dont-prompt"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Don't prompt for mnemonic again (store for automatic use)
            </label>
          </div>

          {dontPromptAgain && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted p-3 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>
                Your recovery phrase will be stored in your user preferences for automatic key rotation.
                You can disable this in your profile settings.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="link" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSubmit} className="cursor-pointer">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
