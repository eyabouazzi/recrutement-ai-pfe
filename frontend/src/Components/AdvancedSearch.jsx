import { useState, useEffect, useMemo } from 'react';
import { Input, Select, DatePicker, Slider, Tag, Button, Space } from 'antd';
import { SearchOutlined, FilterOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Option } = Select;
const { RangePicker } = DatePicker;

export function AdvancedSearch({ 
    data = [], 
    onSearch, 
    filters = [],
    searchableFields = [],
    placeholder = "Rechercher...",
    className = ""
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    // Initialize filter state
    useEffect(() => {
        const initialFilters = {};
        filters.forEach(filter => {
            initialFilters[filter.key] = filter.defaultValue || '';
        });
        setActiveFilters(initialFilters);
    }, [filters]);

    // Apply search and filters
    const filteredData = useMemo(() => {
        let result = [...data];

        // Apply text search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(item => {
                return searchableFields.some(field => {
                    const value = item[field];
                    return value && value.toString().toLowerCase().includes(term);
                });
            });
        }

        // Apply filters
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value === '' || value === null || value === undefined) return;
            
            const filter = filters.find(f => f.key === key);
            if (!filter) return;

            result = result.filter(item => {
                const itemValue = item[key];
                
                switch (filter.type) {
                    case 'select':
                        return Array.isArray(value) ? value.includes(itemValue) : itemValue === value;
                    case 'range':
                        const [min, max] = value;
                        return itemValue >= min && itemValue <= max;
                    case 'date':
                        if (Array.isArray(value) && value[0] && value[1]) {
                            const itemDate = new Date(itemValue);
                            return itemDate >= value[0] && itemDate <= value[1];
                        }
                        return true;
                    case 'boolean':
                        return itemValue === value;
                    default:
                        return itemValue === value;
                }
            });
        });

        return result;
    }, [data, searchTerm, activeFilters, searchableFields, filters]);

    // Notify parent of filtered results
    useEffect(() => {
        if (onSearch) {
            onSearch(filteredData);
        }
    }, [filteredData, onSearch]);

    const handleFilterChange = (key, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const clearFilters = () => {
        const clearedFilters = {};
        filters.forEach(filter => {
            clearedFilters[filter.key] = filter.defaultValue || '';
        });
        setActiveFilters(clearedFilters);
        setSearchTerm('');
    };

    const activeFilterCount = Object.values(activeFilters).filter(v => 
        v !== '' && v !== null && v !== undefined && 
        !(Array.isArray(v) && v.length === 0)
    ).length + (searchTerm ? 1 : 0);

    return (
        <div style={{...styles.container, ...className}}>
            {/* Search Bar */}
            <div style={styles.searchBar}>
                <Input
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={styles.searchInput}
                    allowClear
                />
                
                <Button
                    icon={<FilterOutlined />}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        ...styles.filterButton,
                        ...(activeFilterCount > 0 ? styles.filterButtonActive : {})
                    }}
                >
                    Filtres
                    {activeFilterCount > 0 && (
                        <span style={styles.filterCount}>{activeFilterCount}</span>
                    )}
                </Button>
                
                {(searchTerm || activeFilterCount > 0) && (
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={clearFilters}
                        style={styles.clearButton}
                    >
                        Réinitialiser
                    </Button>
                )}
            </div>

            {/* Active Filters Display */}
            <AnimatePresence>
                {activeFilterCount > 0 && (
                    <motion.div
                        style={styles.activeFilters}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <Space wrap>
                            {searchTerm && (
                                <Tag
                                    closable
                                    onClose={() => setSearchTerm('')}
                                    color="blue"
                                    style={styles.activeTag}
                                >
                                    Recherche: "{searchTerm}"
                                </Tag>
                            )}
                            {Object.entries(activeFilters).map(([key, value]) => {
                                if (value === '' || value === null || value === undefined) return null;
                                
                                const filter = filters.find(f => f.key === key);
                                if (!filter) return null;

                                let displayValue = value;
                                if (Array.isArray(value)) {
                                    if (value.length === 0) return null;
                                    displayValue = value.join(', ');
                                } else if (filter.type === 'select' && filter.options) {
                                    const option = filter.options.find(opt => opt.value === value);
                                    displayValue = option ? option.label : value;
                                }

                                return (
                                    <Tag
                                        key={key}
                                        closable
                                        onClose={() => handleFilterChange(key, '')}
                                        color="purple"
                                        style={styles.activeTag}
                                    >
                                        {filter.label}: {displayValue}
                                    </Tag>
                                );
                            })}
                        </Space>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter Panel */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        style={styles.filterPanel}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <div style={styles.filterGrid}>
                            {filters.map(filter => (
                                <div key={filter.key} style={styles.filterItem}>
                                    <label style={styles.filterLabel}>{filter.label}</label>
                                    
                                    {filter.type === 'select' && (
                                        <Select
                                            mode={filter.multiple ? 'multiple' : undefined}
                                            value={activeFilters[filter.key]}
                                            onChange={value => handleFilterChange(filter.key, value)}
                                            style={styles.filterSelect}
                                            placeholder={filter.placeholder || `Sélectionner ${filter.label}`}
                                            allowClear
                                        >
                                            {filter.options?.map(option => (
                                                <Option key={option.value} value={option.value}>
                                                    {option.label}
                                                </Option>
                                            ))}
                                        </Select>
                                    )}

                                    {filter.type === 'range' && (
                                        <Slider
                                            range
                                            value={activeFilters[filter.key] || filter.defaultValue || [0, 100]}
                                            onChange={value => handleFilterChange(filter.key, value)}
                                            min={filter.min || 0}
                                            max={filter.max || 100}
                                            marks={filter.marks}
                                        />
                                    )}

                                    {filter.type === 'date' && (
                                        <RangePicker
                                            value={activeFilters[filter.key]}
                                            onChange={value => handleFilterChange(filter.key, value)}
                                            style={styles.filterDate}
                                            placeholder={['Date début', 'Date fin']}
                                        />
                                    )}

                                    {filter.type === 'boolean' && (
                                        <Select
                                            value={activeFilters[filter.key]}
                                            onChange={value => handleFilterChange(filter.key, value)}
                                            style={styles.filterSelect}
                                            placeholder={`Sélectionner ${filter.label}`}
                                            allowClear
                                        >
                                            <Option value={true}>Oui</Option>
                                            <Option value={false}>Non</Option>
                                        </Select>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div style={styles.filterActions}>
                            <Button onClick={() => setShowFilters(false)}>
                                Fermer
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const styles = {
    container: {
        marginBottom: 24
    },
    searchBar: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 16
    },
    searchInput: {
        flex: 1,
        height: 40
    },
    filterButton: {
        height: 40,
        position: 'relative'
    },
    filterButtonActive: {
        borderColor: '#8b5cf6',
        color: '#8b5cf6'
    },
    filterCount: {
        position: 'absolute',
        top: -8,
        right: -8,
        background: '#8b5cf6',
        color: '#fff',
        borderRadius: '50%',
        width: 18,
        height: 18,
        fontSize: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    clearButton: {
        height: 40
    },
    activeFilters: {
        marginBottom: 16,
        padding: 12,
        background: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0'
    },
    activeTag: {
        margin: 4
    },
    filterPanel: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20
    },
    filterGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 20,
        marginBottom: 20
    },
    filterItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 500,
        color: '#334155'
    },
    filterSelect: {
        width: '100%'
    },
    filterDate: {
        width: '100%'
    },
    filterActions: {
        display: 'flex',
        justifyContent: 'flex-end'
    }
};