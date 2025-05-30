import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  FormControlLabel, 
  Switch, 
  Typography, 
  Divider,
  Paper,
  Grid,
  IconButton,
  Popover,
  InputAdornment
} from '@mui/material';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const CannedForm = ({ initialData = {}, onSubmit, isEditing = false }) => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    template_name: '',
    template_message: '',
    is_active: true,
    ...initialData
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);
  const emojiButtonRef = useRef(null);
  const open = Boolean(anchorEl);
  const id = open ? 'emoji-popover' : undefined;

  // Set initial form values when initialData changes
  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setFormValues({
        template_name: initialData.template_name || '',
        template_message: initialData.template_message || '',
        is_active: initialData.is_active !== undefined ? initialData.is_active : true
      });
    }
  }, [initialData]);

  // Handle text field changes
  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    
    // For switch input, use checked value
    const newValue = name === 'is_active' ? checked : value;
    
    setFormValues({
      ...formValues,
      [name]: newValue
    });
    
    // Clear the error for this field if it exists
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Handle markdown editor changes
  const handleEditorChange = (value) => {
    setFormValues({
      ...formValues,
      template_message: value || ''
    });
    
    // Clear the error for this field if it exists
    if (errors.template_message) {
      setErrors({
        ...errors,
        template_message: null
      });
    }
  };

  // Handle emoji picker open
  const handleEmojiButtonClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle emoji picker close
  const handleCloseEmoji = () => {
    setAnchorEl(null);
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    // Insert emoji at current position or at the end
    const currentText = formValues.template_message || '';
    let updatedText = '';
    
    if (cursorPosition) {
      updatedText = currentText.substring(0, cursorPosition) + emojiData.native + currentText.substring(cursorPosition);
    } else {
      updatedText = currentText + emojiData.native;
    }
    
    setFormValues({
      ...formValues,
      template_message: updatedText
    });
    
    setAnchorEl(null);
  };

  // Common emojis
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤝', '🤗', '🤔',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💕', '💯', '✅',
    '⭐', '🌟', '💫', '🔥', '🎉', '🎊', '🎁', '🏆', '🥇', '👨‍💻'
  ];

  // Open emoji picker button
  const emojiPickerButton = () => (
    <IconButton 
      onClick={handleEmojiButtonClick}
      color="primary"
      size="small"
      ref={emojiButtonRef}
      aria-describedby={id}
    >
      <EmojiEmotionsIcon />
    </IconButton>
  );

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formValues.template_name.trim()) {
      newErrors.template_name = 'Template name is required';
    }
    
    if (!formValues.template_message?.trim()) {
      newErrors.template_message = 'Template message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      message.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(formValues);
      message.success(`Template ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/dashboard/canned-messages');
    } catch (error) {
      // Handle API errors
      if (error.response?.data) {
        const apiErrors = error.response.data;
        
        // Update form errors from API response
        const formErrors = {};
        Object.keys(apiErrors).forEach(key => {
          formErrors[key] = Array.isArray(apiErrors[key]) 
            ? apiErrors[key][0] 
            : apiErrors[key];
        });
        
        setErrors(formErrors);
        message.error('Please fix the errors in the form');
      } else {
        message.error('Failed to save template. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate('/dashboard/canned-messages');
  };

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
            {isEditing ? 'Edit Template' : 'Create New Template'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditing 
              ? 'Update your canned message template that can be used for quick replies.' 
              : 'Create a new canned message template that can be used for quick replies.'}
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              name="template_name"
              label="Template Name"
              fullWidth
              required
              value={formValues.template_name}
              onChange={handleInputChange}
              error={Boolean(errors.template_name)}
              helperText={errors.template_name || 'Give your template a descriptive name'}
              disabled={isSubmitting}
              sx={{ mb: 3 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Template Message*
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Write your message with formatting. You can use **bold text** for emphasis and include emojis 😊.
            </Typography>
            
            <Box sx={{ position: 'relative', mb: errors.template_message ? 0 : 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <IconButton 
                  onClick={handleEmojiButtonClick}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                >
                  <EmojiEmotionsIcon />
                </IconButton>
                <Typography variant="body2" color="primary">
                  Add emoji
                </Typography>
              </Box>
              <MDEditor
                value={formValues.template_message}
                onChange={handleEditorChange}
                height={250}
                preview="edit"
                textareaProps={{
                  placeholder: "Write your template message here...",
                  disabled: isSubmitting,
                  onClick: (e) => setCursorPosition(e.target.selectionStart)
                }}
                onKeyUp={(e) => setCursorPosition(e.target.selectionStart)}
                onMouseUp={(e) => setCursorPosition(e.target.selectionStart)}
              />
            </Box>
            
            {errors.template_message && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, mb: 3, display: 'block' }}>
                {errors.template_message}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  name="is_active"
                  checked={formValues.is_active}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  color="primary"
                />
              }
              label="Active"
            />
            <Typography variant="body2" color="text.secondary">
              Inactive templates won't be shown in the template selection list
            </Typography>
          </Grid>
        </Grid>
        
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          onClose={handleCloseEmoji}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Box sx={{ p: 1 }}>
            <Picker
              data={data}
              onEmojiSelect={handleEmojiClick}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
            />
          </Box>
        </Popover>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Template' : 'Create Template')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default CannedForm;
