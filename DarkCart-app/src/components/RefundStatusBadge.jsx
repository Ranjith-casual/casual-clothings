import React from 'react';
import { FaCheck, FaHourglass, FaTimes, FaSpinner, FaInfoCircle } from 'react-icons/fa';

const RefundStatusBadge = ({ status, refundStatus, size = 'sm', showIcon = true }) => {
    const getStatusInfo = () => {
        if (status === 'REJECTED') {
            return {
                label: 'Rejected',
                className: 'bg-red-100 text-red-800',
                icon: FaTimes
            };
        }
        
        if (status === 'PENDING') {
            return {
                label: 'Pending',
                className: 'bg-yellow-100 text-yellow-800',
                icon: FaHourglass
            };
        }
        
        if (status === 'APPROVED') {
            if (refundStatus === 'COMPLETED') {
                return {
                    label: 'Refunded',
                    className: 'bg-green-100 text-green-800',
                    icon: FaCheck
                };
            }
            return {
                label: 'Processing',
                className: 'bg-blue-100 text-blue-800',
                icon: FaSpinner
            };
        }
        
        return {
            label: 'Active',
            className: 'bg-gray-100 text-gray-600',
            icon: FaInfoCircle
        };
    };

    const statusInfo = getStatusInfo();
    const Icon = statusInfo.icon;
    
    const sizeClasses = {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    const iconSizes = {
        xs: 'w-2 h-2',
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    return (
        <span className={`inline-flex items-center rounded-full font-medium ${statusInfo.className} ${sizeClasses[size]}`}>
            {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
            {statusInfo.label}
        </span>
    );
};

export default RefundStatusBadge;
