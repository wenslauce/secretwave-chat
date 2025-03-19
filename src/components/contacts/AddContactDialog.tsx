
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, User } from 'lucide-react';

type AddContactDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddContact: (name: string, email: string) => void;
};

const AddContactDialog: React.FC<AddContactDialogProps> = ({ 
  isOpen, 
  onClose, 
  onAddContact 
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [enableEncryption, setEnableEncryption] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Clear error and add contact
    setError(null);
    onAddContact(name, email);
    
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    setEnableEncryption(true);
  };

  const handleClose = () => {
    setError(null);
    setName('');
    setEmail('');
    setPhone('');
    setEnableEncryption(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="flex justify-center my-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-2 rounded-md mb-4">
              {error}
            </div>
          )}
          
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2 pt-2">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${enableEncryption ? 'text-green-500' : 'text-muted-foreground'}`} />
                <Label htmlFor="encryption" className="text-sm font-normal">
                  Enable end-to-end encryption
                </Label>
              </div>
              <Switch
                id="encryption"
                checked={enableEncryption}
                onCheckedChange={setEnableEncryption}
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add Contact</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddContactDialog;
