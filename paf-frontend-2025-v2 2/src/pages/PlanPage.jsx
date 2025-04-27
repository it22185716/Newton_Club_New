import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import learningPlanApi from '../api/planApi';
import userApi from '../api/userApi';

// Set app element for accessibility
Modal.setAppElement('#root');

const PlanPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeRequired: '',
    type: 'weekly'
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
      zIndex: 1000
    }
  };

  // Fetch all plans and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansData, user] = await Promise.all([
          learningPlanApi.getAllLearningPlans(),
          userApi.getUserById(userId)
        ]);
        setPlans(plansData);
        setUserData(user);
        console.log(userData)
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load learning plans');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'timeRequired' ? parseInt(value) || '' : value
    });
  };

  // Open modal for creating new plan
  const openCreateModal = () => {
    setCurrentPlan(null);
    setFormData({
      title: '',
      description: '',
      timeRequired: '',
      type: 'weekly'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing plan
  const openEditModal = (plan) => {
    setCurrentPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description,
      timeRequired: plan.timeRequired,
      type: plan.type
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
    
    if (!formData.title || !formData.description || !formData.timeRequired) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      
      if (currentPlan) {
        // Update existing plan
        const updatedPlan = {
          ...formData,
          user: { id: userId }
        };
        await learningPlanApi.updateLearningPlan(currentPlan.planId, updatedPlan);
        toast.success('Learning plan updated successfully');
      } else {
        // Create new plan
        await learningPlanApi.createLearningPlan(
          formData.title,
          formData.description,
          formData.timeRequired,
          formData.type
        );
        toast.success('Learning plan created successfully');
      }
      
      // Refresh plans list
      const updatedPlans = await learningPlanApi.getAllLearningPlans();
      setPlans(updatedPlans);
      closeModal();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error(currentPlan ? 'Failed to update plan' : 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  // Delete plan
  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this learning plan?')) {
      try {
        setLoading(true);
        await learningPlanApi.deleteLearningPlan(planId);
        toast.success('Learning plan deleted successfully');
        
        // Refresh plans list
        const updatedPlans = await learningPlanApi.getAllLearningPlans();
        setPlans(updatedPlans);
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('Failed to delete plan');
      } finally {
        setLoading(false);
      }
    }
  };

  // Check if user owns the plan
  const isUserPlan = (plan) => {
    return  plan.userId === userId;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && plans.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Learning Plans</h1>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 p-8 rounded-lg text-center">
          <p className="text-xl">No learning plans yet. Create your first plan to get started!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div 
              key={plan.planId} 
              className="bg-white rounded-lg shadow-md overflow-hidden border border-blue-100 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                <h3 className="font-bold text-lg truncate">{plan.title}</h3>
                <div className="flex items-center text-sm text-blue-100">
                  <span className="capitalize">{plan.type}</span>
                  <span className="mx-2">•</span>
                  <span>{plan.timeRequired} min</span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700 mb-4 line-clamp-3">{plan.description}</p>
                <div className="text-sm text-gray-500 mb-4">
                  Created: {formatDate(plan.createdAt)}
                </div>
                
                {isUserPlan(plan) && (
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.planId)}
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
        contentLabel="Learning Plan Modal"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-lg">
          <h2 className="text-xl font-bold text-white">
            {currentPlan ? 'Edit Learning Plan' : 'Create Learning Plan'}
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
              placeholder="e.g. Beginner Cooking Skills"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your learning plan"
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="timeRequired" className="block text-sm font-medium text-gray-700 mb-1">
                Time Required (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="timeRequired"
                name="timeRequired"
                value={formData.timeRequired}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 150"
                required
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
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
              ) : currentPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PlanPage;