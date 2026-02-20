
import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Camera, ChevronDown, Filter, Search } from 'lucide-react';
import type { MenuItem } from '../../types';
import './Settings.css';

export const Settings: React.FC = () => {
    const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, seedDefaultMenu } = useRestaurant();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    const categories = [
        'Dinner', 'Milk Shake & Ice Cream', 'Falooda', 'Fresh Limes',
        'Fruits Salad', 'Mutton', 'Fish', 'Chinese', 'Fried Rice', 'Noodles'
    ];

    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: '',
        price: undefined,
        category: 'Dinner',
        isVeg: true,
        image: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    // Filter states
    const [activeFilterCategory, setActiveFilterCategory] = useState<string>('All');
    const [activeFilterType, setActiveFilterType] = useState<'All' | 'Veg' | 'Non-Veg'>('All');
    const [adminSearchTerm, setAdminSearchTerm] = useState('');

    const filteredMenuItems = menuItems.filter(item => {
        const matchesCategory = activeFilterCategory === 'All' || item.category === activeFilterCategory;
        const matchesType = activeFilterType === 'All' ||
            (activeFilterType === 'Veg' && item.isVeg) ||
            (activeFilterType === 'Non-Veg' && !item.isVeg);
        const matchesSearch = item.name.toLowerCase().includes(adminSearchTerm.toLowerCase());

        return matchesCategory && matchesType && matchesSearch;
    });

    const handleSeed = async () => {
        if (!window.confirm('This will add all default dishes to your menu. Continue?')) return;
        setIsSeeding(true);
        try {
            await seedDefaultMenu();
        } catch (error) {
            alert('Failed to import dishes.');
        } finally {
            setIsSeeding(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            price: undefined,
            category: 'Dinner',
            isVeg: true,
            image: ''
        });
        setIsAdding(false);
        setEditingId(null);
        setIsSaving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || formData.price === undefined) return;

        setIsSaving(true);
        try {
            if (editingId) {
                await updateMenuItem({ ...formData, id: editingId } as MenuItem);
            } else {
                const newItem: MenuItem = {
                    ...formData,
                    id: `m-${Date.now()}`,
                } as MenuItem;
                await addMenuItem(newItem);
            }
            resetForm();
        } catch (error) {
            console.error("Error saving dish:", error);
            alert("Failed to save dish. Please check your connection or database permissions.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (item: MenuItem) => {
        setFormData(item);
        setEditingId(item.id);
        setIsAdding(true);
    };

    return (
        <div className="settings-page">
            <header className="page-header">
                <h1 className="page-title">Menu Management</h1>
                <button
                    className="add-btn"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel' : 'Add'}
                </button>
            </header>

            {isAdding && (
                <div className="dish-form-container card-animate">
                    <form onSubmit={handleSubmit} className="dish-form">
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Dish Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Special Chicken Biryani"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Price</label>
                                <div className="price-input-wrapper">
                                    <span className="currency-symbol">₹</span>
                                    <input
                                        type="number"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({ ...formData, price: e.target.value === '' ? undefined : Number(e.target.value) })}
                                        onKeyDown={(e) => {
                                            if (['e', 'E', '+', '-'].includes(e.key)) {
                                                e.preventDefault();
                                            }
                                        }}
                                        placeholder="Amount"
                                        step="any"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <div className={`custom-dropdown ${isDropdownOpen ? 'open' : ''}`}>
                                    <div
                                        className="dropdown-trigger"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <span>{formData.category}</span>
                                        <ChevronDown size={18} />
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="dropdown-options">
                                            {categories.map((cat) => (
                                                <div
                                                    key={cat}
                                                    className={`dropdown-option ${formData.category === cat ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setFormData({ ...formData, category: cat });
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    {cat}
                                                    {formData.category === cat && <Check size={14} />}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group image-grid-item">
                                <label>Dish Image</label>
                                <div className="image-picker-container">
                                    <input
                                        type="file"
                                        id="dish-image"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setFormData({ ...formData, image: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden-input"
                                    />

                                    {!formData.image ? (
                                        <label htmlFor="dish-image" className="upload-dropzone">
                                            <div className="upload-content">
                                                <div className="upload-icon-circle">
                                                    <Plus size={20} />
                                                </div>
                                                <div className="upload-text">
                                                    <span className="main-text">Click to Upload</span>
                                                    <span className="sub-text">JPG, PNG or WEBP</span>
                                                </div>
                                            </div>
                                        </label>
                                    ) : (
                                        <div className="image-preview-wrapper">
                                            <img src={formData.image} alt="Preview" className="selected-image" />
                                            <div className="image-actions-overlay">
                                                <div className="action-btn-group">
                                                    <button
                                                        type="button"
                                                        className="action-icon-btn remove"
                                                        onClick={() => setFormData({ ...formData, image: '' })}
                                                        title="Remove Image"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                    <label htmlFor="dish-image" className="action-icon-btn change" title="Change Image">
                                                        <Camera size={18} />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="form-actions-bar">
                            <div className="dietary-container">
                                <label className="dietary-option">
                                    <input
                                        type="radio"
                                        name="dietary"
                                        checked={formData.isVeg === true}
                                        onChange={() => setFormData({ ...formData, isVeg: true })}
                                    />
                                    <span className="thick-checkbox"></span>
                                    <span className="dietary-label">Veg</span>
                                </label>
                                <label className="dietary-option">
                                    <input
                                        type="radio"
                                        name="dietary"
                                        checked={formData.isVeg === false}
                                        onChange={() => setFormData({ ...formData, isVeg: false })}
                                    />
                                    <span className="thick-checkbox"></span>
                                    <span className="dietary-label">Non-Veg</span>
                                </label>
                            </div>
                            <button type="submit" className="save-btn" disabled={isSaving}>
                                {isSaving ? <span className="loader-small"></span> : <Check size={18} />}
                                {isSaving ? 'Saving...' : (editingId ? 'Update Dish' : 'Save Dish')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="menu-list-container mt-8">
                <div className="section-header">
                    <h2 className="section-title">Current Dishes ({menuItems.length})</h2>
                    {menuItems.length === 0 && (
                        <button
                            className="seed-btn"
                            onClick={handleSeed}
                            disabled={isSeeding}
                        >
                            {isSeeding ? <span className="loader-small"></span> : <Plus size={16} />}
                            {isSeeding ? 'Restoring...' : 'Restore Previous Dishes'}
                        </button>
                    )}
                </div>

                {menuItems.length > 0 && (
                    <div className="admin-filter-bar card-animate">
                        <div className="filter-search">
                            <Search size={18} />
                            <input
                                type="text"
                                placeholder="Search dishes..."
                                value={adminSearchTerm}
                                onChange={(e) => setAdminSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="filter-group-horizontal">
                            <div className={`filter-custom-dropdown ${isFilterDropdownOpen ? 'open' : ''}`}>
                                <div
                                    className="filter-dropdown-trigger"
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                >
                                    <Filter size={14} className="filter-icon" />
                                    <span>{activeFilterCategory === 'All' ? 'All Categories' : activeFilterCategory}</span>
                                    <ChevronDown size={14} className="chevron" />
                                </div>
                                {isFilterDropdownOpen && (
                                    <div className="filter-dropdown-options card-animate">
                                        <div
                                            className={`filter-option ${activeFilterCategory === 'All' ? 'selected' : ''}`}
                                            onClick={() => {
                                                setActiveFilterCategory('All');
                                                setIsFilterDropdownOpen(false);
                                            }}
                                        >
                                            All Categories
                                        </div>
                                        {categories.map(cat => (
                                            <div
                                                key={cat}
                                                className={`filter-option ${activeFilterCategory === cat ? 'selected' : ''}`}
                                                onClick={() => {
                                                    setActiveFilterCategory(cat);
                                                    setIsFilterDropdownOpen(false);
                                                }}
                                            >
                                                {cat}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="type-filters">
                                <button
                                    className={`type-btn ${activeFilterType === 'All' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterType('All')}
                                >
                                    All
                                </button>
                                <button
                                    className={`type-btn ${activeFilterType === 'Veg' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterType('Veg')}
                                >
                                    <span className="dietary-dot veg mr-1"></span>
                                    Veg
                                </button>
                                <button
                                    className={`type-btn ${activeFilterType === 'Non-Veg' ? 'active' : ''}`}
                                    onClick={() => setActiveFilterType('Non-Veg')}
                                >
                                    <span className="dietary-dot non-veg mr-1"></span>
                                    Non-Veg
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {menuItems.length === 0 ? (
                    <div className="empty-state">
                        <ImageIcon size={48} />
                        <p>No dishes added yet in the cloud database.</p>
                        <p className="empty-subtext">Click above to restore previous dishes or add a new one manually.</p>
                    </div>
                ) : filteredMenuItems.length === 0 ? (
                    <div className="empty-state">
                        <Filter size={48} />
                        <p>No dishes match your filters.</p>
                        <button onClick={() => {
                            setActiveFilterCategory('All');
                            setActiveFilterType('All');
                            setAdminSearchTerm('');
                        }} className="btn-link mt-4">Clear All Filters</button>
                    </div>
                ) : (
                    <div className="menu-grid">
                        {filteredMenuItems.map(item => (
                            <div key={item.id} className="menu-item-card">
                                <div className="item-details">
                                    <span className={`dietary-badge ${item.isVeg ? 'veg' : 'non-veg'}`}>
                                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                                    </span>
                                    <h3>{item.name}</h3>
                                    <p className="item-category">{item.category}</p>
                                    <p className="item-price">₹{item.price}</p>
                                </div>
                                <div className="item-actions">
                                    <button onClick={() => handleEdit(item)} className="edit-btn" title="Edit">
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => deleteMenuItem(item.id)} className="delete-btn" title="Delete">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
