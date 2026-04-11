import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Space, Tag, Dropdown, Menu } from 'antd';
import { SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, EditOutlined, DeleteOutlined, MoreOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AdvancedSearch } from './AdvancedSearch';

export function EnhancedTable({
    data = [],
    columns = [],
    loading = false,
    onRowClick,
    actions = [],
    searchable = true,
    filterable = true,
    exportable = true,
    pagination = true,
    rowKey = '_id',
    className = '',
    onSearch,
    filters = []
}) {
    const [filteredData, setFilteredData] = useState(data);
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const [tablePagination, setTablePagination] = useState({
        current: 1,
        pageSize: 10,
        total: data.length,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} éléments`
    });

    // Update filtered data when source data changes
    useEffect(() => {
        setFilteredData(data);
        setTablePagination(prev => ({
            ...prev,
            total: data.length
        }));
    }, [data]);

    // Handle search results from AdvancedSearch — stable ref to prevent infinite loop
    const handleSearchResults = useCallback((results) => {
        setFilteredData(results);
        setTablePagination(prev => ({
            ...prev,
            total: results.length,
            current: 1
        }));
        if (onSearch) onSearch(results);
    }, [onSearch]);

    // Enhanced columns with actions
    const enhancedColumns = [
        ...columns,
        ...(actions.length > 0 ? [{
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    {actions.map(action => {
                        if (action.type === 'button') {
                            return (
                                <Button
                                    key={action.key}
                                    type="link"
                                    size="small"
                                    icon={action.icon}
                                    onClick={() => action.onClick(record)}
                                    style={{ padding: 4 }}
                                >
                                    {action.label}
                                </Button>
                            );
                        }
                        return null;
                    })}
                    
                    {actions.length > 2 && (
                        <Dropdown
                            menu={{
                                items: actions.slice(2).map(action => ({
                                    key: action.key,
                                    icon: action.icon,
                                    label: action.label,
                                    onClick: () => action.onClick(record)
                                }))
                            }}
                            trigger={['click']}
                        >
                            <Button type="link" size="small" icon={<MoreOutlined />} />
                        </Dropdown>
                    )}
                </Space>
            )
        }] : [])
    ];

    // Export functionality
    const handleExport = (format = 'csv') => {
        if (format === 'csv') {
            const headers = columns.map(col => col.title);
            const rows = filteredData.map(row => 
                columns.map(col => {
                    const value = col.dataIndex ? row[col.dataIndex] : '';
                    return `"${value}"`;
                }).join(',')
            );
            
            const csvContent = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
            link.click();
        }
    };

    return (
        <motion.div
            style={{...styles.container, ...className}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Toolbar */}
            <div style={styles.toolbar}>
                <div style={styles.toolbarLeft}>
                    {searchable && (
                        <Input
                            placeholder="Recherche rapide..."
                            prefix={<SearchOutlined />}
                            value={localSearchTerm}
                            onChange={e => setLocalSearchTerm(e.target.value)}
                            style={styles.quickSearch}
                            allowClear
                        />
                    )}
                </div>
                
                <div style={styles.toolbarRight}>
                    {exportable && (
                        <Button
                            icon={<DownloadOutlined />}
                            onClick={() => handleExport('csv')}
                        >
                            Exporter
                        </Button>
                    )}
                </div>
            </div>

            {/* Advanced Search */}
            {filterable && filters.length > 0 && (
                <AdvancedSearch
                    data={data}
                    onSearch={handleSearchResults}
                    filters={filters}
                    searchableFields={columns.filter(col => col.searchable !== false).map(col => col.dataIndex)}
                />
            )}

            {/* Table */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            >
                <Table
                    columns={enhancedColumns}
                    dataSource={filteredData}
                    loading={loading}
                    rowKey={rowKey}
                    pagination={pagination ? tablePagination : false}
                    onChange={(pagination, filters, sorter) => {
                        setTablePagination(pagination);
                    }}
                    onRow={(record) => ({
                        onClick: onRowClick ? () => onRowClick(record) : undefined,
                        style: { cursor: onRowClick ? 'pointer' : 'default' }
                    })}
                    scroll={{ x: 'max-content' }}
                />
            </motion.div>
        </motion.div>
    );
}

// Predefined action configurations
export const tableActions = {
    view: {
        key: 'view',
        type: 'button',
        label: 'Voir',
        icon: <EyeOutlined />,
        onClick: (record) => console.log('View', record)
    },
    edit: {
        key: 'edit',
        type: 'button',
        label: 'Modifier',
        icon: <EditOutlined />,
        onClick: (record) => console.log('Edit', record)
    },
    delete: {
        key: 'delete',
        type: 'button',
        label: 'Supprimer',
        icon: <DeleteOutlined />,
        onClick: (record) => console.log('Delete', record),
        danger: true
    }
};

const styles = {
    container: {
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #e2e8f0',
        overflow: 'hidden'
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #f1f5f9',
        background: '#f8fafc'
    },
    toolbarLeft: {
        flex: 1
    },
    toolbarRight: {
        display: 'flex',
        gap: 12
    },
    quickSearch: {
        width: 300,
        maxWidth: '100%'
    }
};