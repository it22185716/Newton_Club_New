import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import progressUpdateApi from '../api/progressApi';

// Set app element for accessibility
Modal.setAppElement('#root');

const ProgressPage = () => {
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    update: '',
    goalsAchieved: false
  });

  const userId = localStorage.getItem('userId');

  // Modal styles
  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '500px',
      width: '90%',
      borderRadius: '8px',
      padding: '0',
      border: 'none',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(2px)',
      zIndex: 1000
    }
  };

  // Fetch all progress updates
  useEffect(() => {
    const fetchProgressUpdates = async () => {
      try {
        setLoading(true);
        const data = await progressUpdateApi.getAllProgressUpdates();
        setProgressUpdates(data);
      } catch (error) {
        console.error('Error fetching progress updates:', error);
        toast.error('Failed to load progress updates');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressUpdates();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for creating new progress update
  const openCreateModal = () => {
    setCurrentProgress(null);
    setFormData({
      title: '',
      update: '',
      goalsAchieved: false
    });
    setIsModalOpen(true);
  };

  // Open modal for editing progress update
  const openEditModal = (progress) => {
    setCurrentProgress(progress);
    setFormData({
      title: progress.title,
      update: progress.update,
      goalsAchieved: progress.goalsAchieved
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.update) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const progressData = {
        ...formData,
        user: { id: userId }
      };
      
      if (currentProgress) {
        // Update existing progress
        await progressUpdateApi.updateProgressUpdate(currentProgress.id, progressData);
        toast.success('Progress update modified successfully');
      } else {
        // Create new progress update
        await progressUpdateApi.createProgressUpdate(progressData);
        toast.success('Progress update created successfully');
      }
      
      // Refresh progress updates list
      const updatedProgressList = await progressUpdateApi.getAllProgressUpdates();
      setProgressUpdates(updatedProgressList);
      closeModal();
    } catch (error) {
      console.error('Error saving progress update:', error);
      toast.error(currentProgress ? 'Failed to update progress' : 'Failed to create progress update');
    } finally {
      setLoading(false);
    }
  };

  // Delete progress update
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this progress update?')) {
      try {
        setLoading(true);
        await progressUpdateApi.deleteProgressUpdate(id);
        toast.success('Progress update deleted successfully');
        
        // Refresh progress updates list
        const updatedProgressList = await progressUpdateApi.getAllProgressUpdates();
        setProgressUpdates(updatedProgressList);
      } catch (error) {
        console.error('Error deleting progress update:', error);
        toast.error('Failed to delete progress update');
      } finally {
        setLoading(false);
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && progressUpdates.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Progress Updates</h1>
        {userId && (
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Progress Update
          </button>
        )}
      </div>

      {progressUpdates.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 p-8 rounded-lg text-center">
          <p className="text-xl">No progress updates yet. Start tracking your learning journey!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {progressUpdates.map((progress) => (
            <div 
              key={progress.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`px-4 py-3 text-white ${progress.goalsAchieved ? 'bg-gradient-to-r from-blue-500 to-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-600'}`}>
                <h3 className="font-bold text-lg truncate">{progress.title}</h3>
                <div className="flex items-center text-sm">
                  <span>{formatDate(progress.createdAt)}</span>
                  {progress.goalsAchieved && (
                    <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 rounded-full text-xs font-medium">
                      Goals Achieved
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700 mb-4">{progress.update}</p>
                
                {userId === progress.userId && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={() => openEditModal(progress)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(progress.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Progress Update Modal"
      >
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-t-lg animate-gradient-x">
          <h2 className="text-xl font-bold text-white">
            {currentProgress ? 'Edit Progress Update' : 'Add Progress Update'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white rounded-b-lg">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Completed Week 1 Goals"
              required
            />
          </div>
          
          <div>
            <label htmlFor="update" className="block text-sm font-medium text-gray-700 mb-1">
              Progress Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="update"
              name="update"
              value={formData.update}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your progress and achievements"
              required
            ></textarea>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="goalsAchieved"
              name="goalsAchieved"
              checked={formData.goalsAchieved}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="goalsAchieved" className="ml-2 block text-sm text-gray-700">
              Goals Achieved
            </label>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : currentProgress ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProgressPage;