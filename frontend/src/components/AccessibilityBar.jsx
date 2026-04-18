import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Switch, Slider, Collapse } from '@mui/material';
// This assumes the existence of useProfile hook or context. If not, this serves as the functional skeleton hooking to DOM.

const AccessibilityBar = () => {
  const [expanded, setExpanded] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fontSizeRatio, setFontSizeRatio] = useState(1);
  const [dyslexicFont, setDyslexicFont] = useState(false);
  const [contrastMode, setContrastMode] = useState('default');

  // Load OS prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);
  }, []);

  // Sync to DOM instantly
  useEffect(() => {
    document.body.style.fontSize = `${16 * fontSizeRatio}px`;
    document.body.style.fontFamily = dyslexicFont ? "'OpenDyslexic', sans-serif" : "Roboto, Arial, sans-serif";
    
    if (contrastMode === 'high') {
      document.body.style.backgroundColor = '#000000';
      document.body.style.color = '#ffffff';
    } else if (contrastMode === 'dyslexia') {
      document.body.style.backgroundColor = '#fffdf7'; // soft yellow
      document.body.style.color = '#333333';
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  }, [fontSizeRatio, dyslexicFont, contrastMode]);

  const minTouch = '48px';

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 9999,
        maxWidth: 350,
        width: '100%',
      }}
      role="complementary"
      aria-label="Universal Accessibility Controls"
    >
      <Paper 
        elevation={6} 
        sx={{ 
          p: 0, 
          overflow: 'hidden', 
          border: '2px solid',
          borderColor: contrastMode === 'high' ? '#fff' : 'primary.main',
          borderRadius: 3
        }}
      >
        {/* Header Toggle */}
        <Box 
          component="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="a11y-panel"
          sx={{
            width: '100%',
            minHeight: minTouch,
            bgcolor: 'primary.main',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            cursor: 'pointer',
            '&:focus': { outline: '3px solid #ffcc00', outlineOffset: '-3px' }
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">♿ Accessibility Tools</Typography>
          <Typography variant="body1">{expanded ? '▼' : '▲'}</Typography>
        </Box>

        {/* Panel Content */}
        <Collapse in={expanded}>
          <Box id="a11y-panel" p={2} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
            
            {/* Font Size Row */}
            <Box mb={2}>
              <Typography variant="body2" id="font-size-label" fontWeight="bold" gutterBottom>Text Size</Typography>
              <Slider 
                aria-labelledby="font-size-label"
                value={fontSizeRatio} 
                min={0.8} max={1.6} step={0.2} 
                onChange={(_, val) => setFontSizeRatio(val)}
                marks
                sx={{ height: 8 }}
              />
            </Box>

            {/* Toggles */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ minHeight: minTouch }}>
              <Typography variant="body2" fontWeight="bold">Dyslexic Font</Typography>
              <Switch 
                checked={dyslexicFont} 
                onChange={(e) => setDyslexicFont(e.target.checked)} 
                inputProps={{ 'aria-label': 'Toggle Dyslexic friendly font' }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ minHeight: minTouch }}>
              <Typography variant="body2" fontWeight="bold">Auto-Audio Cues</Typography>
              <Switch 
                checked={audioEnabled} 
                onChange={(e) => setAudioEnabled(e.target.checked)} 
                inputProps={{ 'aria-label': 'Toggle automatic audio reading' }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ minHeight: minTouch }}>
              <Typography variant="body2" fontWeight="bold">Reduce Motion</Typography>
              <Switch 
                checked={reduceMotion} 
                onChange={(e) => setReduceMotion(e.target.checked)} 
                inputProps={{ 'aria-label': 'Disable interface animations' }}
              />
            </Box>

            {/* Contrast Mode */}
            <Box>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Color Scheme</Typography>
              <Box display="flex" gap={1}>
                {['default', 'dyslexia', 'high'].map((mode) => (
                  <Box
                    key={mode}
                    component="button"
                    onClick={() => setContrastMode(mode)}
                    aria-label={`Set color scheme to ${mode}`}
                    aria-pressed={contrastMode === mode}
                    sx={{
                      flex: 1,
                      minHeight: minTouch,
                      bgcolor: mode === 'high' ? '#000' : (mode === 'dyslexia' ? '#fffdf7' : '#e0e0e0'),
                      color: mode === 'high' ? '#fff' : '#000',
                      border: contrastMode === mode ? '3px solid #1976d2' : '1px solid #ccc',
                      borderRadius: 1,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      textTransform: 'capitalize',
                      '&:focus': { outline: '3px solid #ffcc00' }
                    }}
                  >
                    {mode === 'high' ? 'High' : (mode === 'dyslexia' ? 'Soft' : 'Reg')}
                  </Box>
                ))}
              </Box>
            </Box>

          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default AccessibilityBar;
