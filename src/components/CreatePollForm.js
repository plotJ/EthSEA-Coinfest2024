import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, MinusCircle } from 'lucide-react'; // Import icons

export function CreatePollForm({ onCreatePoll }) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with two empty options

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validOptions = options.filter(option => option.trim() !== '');
    if (title && validOptions.length >= 2) {
      onCreatePoll(title, validOptions);
      setTitle('');
      setOptions(['', '']);
    } else {
      alert('Please enter a title and at least two non-empty options.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="poll-title">Poll Title</Label>
        <Input
          id="poll-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter poll title"
          required
        />
      </div>
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
          />
          {index >= 2 && (
            <Button 
              type="button" 
              onClick={() => handleRemoveOption(index)}
              variant="outline"
              size="icon"
            >
              <MinusCircle className="h-4 w-4" />
            </Button>
          )}
          {index === options.length - 1 && (
            <Button 
              type="button" 
              onClick={handleAddOption}
              variant="outline"
              size="icon"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="submit" className="w-full">Create Poll</Button>
    </form>
  );
}
