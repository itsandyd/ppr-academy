"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus,
  Trash2,
  Clock,
  Calendar as CalendarIcon,
  Save,
  Loader2
} from "lucide-react";
import { setCoachAvailability, getCoachAvailability } from "@/app/actions/coaching-actions";

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function CoachScheduleManager() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSlot, setNewSlot] = useState<TimeSlot>({ startTime: '', endTime: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedDate) {
      loadAvailability();
    }
  }, [selectedDate]);

  const loadAvailability = async () => {
    if (!selectedDate) return;
    
    setIsLoading(true);
    try {
      const result = await getCoachAvailability(selectedDate);
      if (result.success && result.availability) {
        const slots = result.availability.map((slot: any) => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        }));
        setTimeSlots(slots);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      toast({
        title: "Missing Information",
        description: "Please enter both start and end times.",
        variant: "destructive",
      });
      return;
    }

    if (newSlot.startTime >= newSlot.endTime) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    // Check for overlapping slots
    const overlaps = timeSlots.some(slot => 
      (newSlot.startTime < slot.endTime && newSlot.endTime > slot.startTime)
    );

    if (overlaps) {
      toast({
        title: "Time Conflict",
        description: "This time slot overlaps with an existing slot.",
        variant: "destructive",
      });
      return;
    }

    setTimeSlots(prev => [...prev, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewSlot({ startTime: '', endTime: '' });
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const saveAvailability = async () => {
    if (!selectedDate) {
      toast({
        title: "No Date Selected",
        description: "Please select a date first.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await setCoachAvailability({
        date: selectedDate,
        timeSlots
      });

      if (result.success) {
        toast({
          title: "Availability Updated",
          description: `Successfully saved ${result.slots} time slots for ${selectedDate.toLocaleDateString()}.`,
        });
      } else {
        toast({
          title: "Save Failed",
          description: result.error || "Failed to save availability",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving your availability.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addQuickSlots = (type: 'morning' | 'afternoon' | 'evening' | 'fullday') => {
    const quickSlots: { [key: string]: TimeSlot[] } = {
      morning: [{ startTime: '09:00', endTime: '12:00' }],
      afternoon: [{ startTime: '13:00', endTime: '17:00' }],
      evening: [{ startTime: '18:00', endTime: '21:00' }],
      fullday: [
        { startTime: '09:00', endTime: '12:00' },
        { startTime: '13:00', endTime: '17:00' }
      ]
    };

    const slotsToAdd = quickSlots[type];
    const newSlots = [...timeSlots];

    slotsToAdd.forEach(slot => {
      const overlaps = newSlots.some(existing => 
        (slot.startTime < existing.endTime && slot.endTime > existing.startTime)
      );
      
      if (!overlaps) {
        newSlots.push(slot);
      }
    });

    setTimeSlots(newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Manage Your Coaching Schedule
          </CardTitle>
          <p className="text-slate-600">
            Set your availability for students to book coaching sessions. Select a date and add your available time slots.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendar Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Select Date</Label>
              <div className="border rounded-lg p-3">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="w-full"
                />
              </div>
            </div>

            {/* Time Slot Management */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Availability for {selectedDate?.toLocaleDateString() || 'No date selected'}
                </Label>
                
                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickSlots('morning')}
                    className="text-xs"
                  >
                    Morning (9-12)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickSlots('afternoon')}
                    className="text-xs"
                  >
                    Afternoon (1-5)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickSlots('evening')}
                    className="text-xs"
                  >
                    Evening (6-9)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addQuickSlots('fullday')}
                    className="text-xs"
                  >
                    Full Day
                  </Button>
                </div>

                {/* Manual Time Slot Entry */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                  <Label className="text-sm font-medium">Add Custom Time Slot</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="start-time" className="text-xs text-slate-600">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={newSlot.startTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs text-slate-600">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={newSlot.endTime}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={addTimeSlot}
                    size="sm"
                    className="w-full"
                    disabled={!newSlot.startTime || !newSlot.endTime}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Time Slot
                  </Button>
                </div>

                {/* Current Time Slots */}
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <>
                      <Label className="text-sm font-medium">Current Time Slots</Label>
                      {timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white border rounded-lg"
                        >
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {calculateDuration(slot.startTime, slot.endTime)}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm">No time slots set for this date</p>
                      <p className="text-xs text-slate-400">Add your available hours above</p>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <Button
                  onClick={saveAvailability}
                  disabled={isSaving || timeSlots.length === 0}
                  className="w-full mt-4"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Availability
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function calculateDuration(startTime: string, endTime: string): string {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours === 1) return '1 hour';
  if (diffHours < 1) return `${Math.round(diffHours * 60)} min`;
  return `${diffHours} hours`;
} 