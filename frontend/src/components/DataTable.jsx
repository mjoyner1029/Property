import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  Box,
  Typography,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const DataTable = ({
  title,
  columns,
  data,
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  searchable = true,
  sortable = true,
  emptyMessage = 'No data available'
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState(columns[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter((row) => 
        columns.some(column => {
          const value = row[column.id];
          if (value == null) return false;
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;

  // Sort and paginate data
  const sortedData = sortable
    ? stableSort(filteredData, getComparator(order, orderBy))
    : filteredData;

  const paginatedData = sortedData.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper 
      sx={{ 
        width: '100%',
        backgroundColor: '#1F2327',
        color: '#F5F5F5',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      {/* Header with title and search */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        
        {searchable && (
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
            sx={{
              width: 250,
              backgroundColor: '#262b31',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        )}
      </Box>
      
      <TableContainer>
        <Table aria-label={title || "data table"}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  style={{ 
                    minWidth: column.minWidth,
                    width: column.width,
                    fontWeight: 'bold',
                    backgroundColor: '#1a1e23',
                    color: '#F5F5F5'
                  }}
                >
                  {sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '&.MuiTableSortLabel-root': {
                          color: '#F5F5F5',
                        },
                        '&.MuiTableSortLabel-root:hover': {
                          color: 'primary.main',
                        },
                        '&.Mui-active': {
                          color: 'primary.main',
                        },
                        '& .MuiTableSortLabel-icon': {
                          color: 'primary.main !important',
                        },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow 
                  hover 
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align || 'left'}
                        sx={{ color: '#F5F5F5', borderColor: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  align="center"
                  sx={{ color: '#F5F5F5', py: 3 }}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          color: '#F5F5F5',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiTablePagination-select': {
            color: '#F5F5F5',
          },
          '& .MuiTablePagination-selectIcon': {
            color: '#F5F5F5',
          },
        }}
      />
    </Paper>
  );
};

export default DataTable;