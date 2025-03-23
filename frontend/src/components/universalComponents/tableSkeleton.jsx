import React from 'react';
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const TableSkeleton = ({ columns = 5, rows = 5, dense = false }) => {
  // Generate an array of the specified length
  const rowArray = Array.from({ length: rows }, (_, i) => i);
  const columnArray = Array.from({ length: columns }, (_, i) => i);

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table size={dense ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            {columnArray.map((col) => (
              <TableCell key={`head-${col}`}>
                <Skeleton animation="wave" height={24} width="80%" />
              </TableCell>
            ))}
            {/* One more for actions column */}
            <TableCell>
              <Skeleton animation="wave" height={24} width="50%" />
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rowArray.map((row) => (
            <TableRow key={`row-${row}`}>
              {columnArray.map((col) => (
                <TableCell key={`cell-${row}-${col}`}>
                  <Skeleton animation="wave" height={24} width={col === 0 ? "60%" : "40%"} />
                </TableCell>
              ))}
              {/* Actions column */}
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Skeleton animation="wave" variant="circular" width={24} height={24} />
                  <Skeleton animation="wave" variant="circular" width={24} height={24} />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableSkeleton;
