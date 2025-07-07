import React, { useEffect, useState } from 'react';
import { getServiceCategories, createServiceCategory, updateServiceCategory, deleteServiceCategory } from '../services/api';
import './DashboardHomeScreen.css'; // Reuse common styles

const ServiceCategoryManagementScreen = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null); // For editing
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getServiceCategories();
      setCategories(response.data || []);
    } catch (e) {
      console.error("Failed to fetch service categories:", e);
      setError("Could not load service categories.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModalForCreate = () => {
    setCurrentCategory(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openModalForEdit = (category) => {
    setCurrentCategory(category);
    setName(category.name);
    setDescription(category.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setName('');
    setDescription('');
    setError(null); // Clear modal-specific errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Category name is required."); // Simple validation
      return;
    }
    setIsLoading(true); // Indicate loading for submit action
    setError(null);

    const categoryData = { name, description };

    try {
      if (currentCategory && currentCategory.id) {
        await updateServiceCategory(currentCategory.id, categoryData);
      } else {
        await createServiceCategory(categoryData);
      }
      await fetchCategories(); // Refresh list
      closeModal();
    } catch (e) {
      console.error("Failed to save category:", e.response?.data || e.message);
      setError(e.response?.data?.name?.join(', ') || e.response?.data?.detail || "Failed to save category.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      setIsLoading(true);
      try {
        await deleteServiceCategory(categoryId);
        await fetchCategories(); // Refresh list
      } catch (e) {
        console.error("Failed to delete category:", e);
        setError("Failed to delete category. It might be in use.");
        // alert("Failed to delete category. It might be in use or another error occurred.");
      }
      setIsLoading(false);
    }
  };

  if (isLoading && categories.length === 0 && !isModalOpen) { // Only show main loader if not just modal action
    return <p className="loading-message">Loading categories...</p>;
  }

  // General error display (not modal specific)
  const generalError = error && !isModalOpen ? <p className="error-message-component">{error}</p> : null;


  return (
    <div className="dashboard-main-content">
      <h2>Service Category Management</h2>
      {generalError}
      <button onClick={openModalForCreate} style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Add New Category
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{currentCategory ? 'Edit' : 'Add'} Service Category</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="categoryName">Name:</label>
                <input type="text" id="categoryName" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="categoryDescription">Description (Optional):</label>
                <textarea id="categoryDescription" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              {error && isModalOpen && <p className="error-message" style={{fontSize: '14px'}}>{error}</p>}
              <div className="modal-actions">
                <button type="submit" disabled={isLoading} className="save-button">
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={closeModal} className="cancel-button">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categories.length === 0 && !isLoading ? (
        <p>No service categories found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.id}</td>
                <td>{category.name}</td>
                <td>{category.description || '-'}</td>
                <td>
                  <button className="edit-button" onClick={() => openModalForEdit(category)}>Edit</button>
                  <button className="delete-button" onClick={() => handleDelete(category.id)} disabled={isLoading}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Basic Modal Styling (can be moved to a separate CSS file) */}
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          width: 90%;
          max-width: 500px;
        }
        .modal-content h3 {
          margin-top: 0;
          margin-bottom: 20px;
        }
        .modal-content .form-group {
          margin-bottom: 15px;
        }
        .modal-content .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        .modal-content .form-group input,
        .modal-content .form-group textarea {
          width: calc(100% - 22px); /* Account for padding & border */
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal-content .form-group textarea {
            min-height: 80px;
        }
        .modal-actions {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
        .modal-actions button {
          padding: 10px 15px;
          margin-left: 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .modal-actions .save-button {
          background-color: #28a745; /* Green */
          color: white;
        }
        .modal-actions .cancel-button {
          background-color: #6c757d; /* Grey */
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ServiceCategoryManagementScreen;
