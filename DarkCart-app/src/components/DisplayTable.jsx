import React from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

const DisplayTable = ({ data, column }) => {
  const table = useReactTable({
    data,
    columns : column,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="p-4">
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className='w-full border-collapse'>
          <thead className='bg-black text-white'>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <th className='border border-gray-600 px-4 py-3 text-left font-semibold tracking-wide text-sm'>
                  Sr.No
                </th>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className='border border-gray-600 px-4 py-3 text-left font-semibold tracking-wide text-sm whitespace-nowrap'>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className='bg-white'>
            {table.getRowModel().rows.map((row,index) => (
              <tr key={row.id} className='hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0'>
                <td className='border-r border-gray-200 px-4 py-3 text-gray-700 font-medium'>
                  {index+1}
                </td>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className='border-r border-gray-200 px-4 py-3 text-gray-900 whitespace-nowrap last:border-r-0'>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Empty state message */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg font-medium">No data available</p>
          <p className="text-sm">Check back later for updates</p>
        </div>
      )}
      
      <div className="h-4" />
    </div>
  )
}

export default DisplayTable