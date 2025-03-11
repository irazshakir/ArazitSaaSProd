import React from 'react';
import { Card, Typography, Divider, Collapse } from 'antd';

const { Panel } = Collapse;

/**
 * Reusable form section component for grouping related form fields using Ant Design
 * @param {string} title - Section title
 * @param {string} description - Optional section description
 * @param {React.ReactNode} children - Form fields to display in the section
 * @param {boolean} collapsible - Whether the section is collapsible
 * @param {boolean} defaultExpanded - Default expanded state if collapsible
 * @param {boolean} divider - Whether to show a divider below the title
 * @param {object} style - Additional styling
 */
const FormSection = ({
  title,
  description = '',
  children,
  collapsible = false,
  defaultExpanded = true,
  divider = true,
  padding = true,
  elevation = 0, // Not used in Ant Design
  sx = {},
}) => {
  if (collapsible) {
    return (
      <Collapse
        defaultActiveKey={defaultExpanded ? ['1'] : []}
        style={{ marginBottom: 24, ...sx }}
        bordered={elevation > 0}
      >
        <Panel 
          header={
            <div>
              <Typography.Title level={5} style={{ margin: 0 }}>
                {title}
              </Typography.Title>
              {description && (
                <Typography.Text type="secondary">
                  {description}
                </Typography.Text>
              )}
            </div>
          } 
          key="1"
        >
          {children}
        </Panel>
      </Collapse>
    );
  }

  return (
    <Card
      title={title}
      style={{ marginBottom: 24, ...sx }}
      bordered={elevation > 0}
      bodyStyle={{ padding: padding ? 24 : 0 }}
    >
      {description && (
        <Typography.Paragraph type="secondary" style={{ marginTop: -16, marginBottom: 16 }}>
          {description}
        </Typography.Paragraph>
      )}
      
      {divider && <Divider style={{ marginTop: 0 }} />}
      
      {children}
    </Card>
  );
};

export default FormSection;
