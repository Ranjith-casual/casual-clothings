import React from 'react';
import { FaCheck, FaHourglass, FaSpinner, FaTimes } from 'react-icons/fa';

const RefundProgress = ({ status, refundStatus, vertical = false, showLabels = true }) => {
    const getSteps = () => {
        const steps = [
            { 
                label: 'Requested', 
                completed: true,
                icon: FaCheck,
                description: 'Refund request submitted'
            },
            { 
                label: 'Approved', 
                completed: status === 'APPROVED' || status === 'PROCESSED',
                icon: status === 'REJECTED' ? FaTimes : FaCheck,
                description: status === 'REJECTED' ? 'Request rejected' : 'Request approved by admin'
            },
            { 
                label: 'Processing', 
                completed: status === 'APPROVED' && refundStatus !== 'PENDING',
                icon: FaSpinner,
                description: 'Refund being processed'
            },
            { 
                label: 'Refunded', 
                completed: refundStatus === 'COMPLETED',
                icon: FaCheck,
                description: 'Refund completed successfully'
            }
        ];

        // If rejected, modify the steps
        if (status === 'REJECTED') {
            return steps.slice(0, 2); // Only show first two steps
        }

        return steps;
    };

    const steps = getSteps();

    if (vertical) {
        return (
            <div className="flex flex-col space-y-4">
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === steps.length - 1;
                    
                    return (
                        <div key={index} className="flex items-start">
                            <div className="flex flex-col items-center mr-4">
                                <div className={`
                                    flex items-center justify-center w-8 h-8 rounded-full border-2 
                                    ${step.completed 
                                        ? 'bg-green-500 border-green-500 text-white' 
                                        : 'bg-gray-200 border-gray-300 text-gray-500'
                                    }
                                `}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                {!isLast && (
                                    <div className={`
                                        w-0.5 h-8 mt-2 
                                        ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
                                    `}></div>
                                )}
                            </div>
                            {showLabels && (
                                <div className="flex-1 min-w-0">
                                    <p className={`
                                        text-sm font-medium 
                                        ${step.completed ? 'text-green-600' : 'text-gray-500'}
                                    `}>
                                        {step.label}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {step.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Horizontal layout
    return (
        <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === steps.length - 1;
                
                return (
                    <div key={index} className="flex items-center">
                        <div className="flex flex-col items-center">
                            <div className={`
                                flex items-center justify-center w-6 h-6 rounded-full border-2 
                                ${step.completed 
                                    ? 'bg-green-500 border-green-500 text-white' 
                                    : 'bg-gray-200 border-gray-300 text-gray-500'
                                }
                            `}>
                                <Icon className="w-3 h-3" />
                            </div>
                            {showLabels && (
                                <span className={`
                                    text-xs mt-1 text-center max-w-16
                                    ${step.completed ? 'text-green-600' : 'text-gray-500'}
                                `}>
                                    {step.label}
                                </span>
                            )}
                        </div>
                        {!isLast && (
                            <div className={`
                                flex-1 h-0.5 mx-2 min-w-8
                                ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
                            `}></div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default RefundProgress;
