import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import {
  IconFocus,
  IconHome,
  IconMinus,
  IconPlus,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import * as d3 from 'd3';
import { useEffect, useRef, useState } from 'react';
import { useMultiplePhotos } from '../../hooks/useMultiplePhotos';
import { type Person, type ProjectData } from '../../types/models';
import { getFirstName } from '../../utils';
import styles from './NetworkCanvas.module.css';

// Store node positions globally to persist across tab switches
const savedNodePositions = new Map<string, { x: number; y: number }>();

type Props = {
  readonly project: ProjectData;
  readonly selectedId?: string | null;
  readonly onSelect?: (id: string) => void;
};

type D3Node = {
  id: string;
  person: Person;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
};

type D3Link = {
  source: string | D3Node;
  target: string | D3Node;
  type: string;
};

export default function NetworkCanvas({
  project,
  selectedId,
  onSelect,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [layoutKey, setLayoutKey] = useState(0); // For forcing re-layout

  // Use the new hook to load photos for all people
  const { photoUrls } = useMultiplePhotos(project?.people || []);

  useEffect(() => {
    if (!project || !svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Get actual container dimensions
    const containerRect = svgRef.current.getBoundingClientRect();
    const width = containerRect.width || 1200; // fallback to 1200 if not available
    const height = containerRect.height || 800; // fallback to 800 if not available

    // Clean up existing content
    svg.selectAll('g').remove();
    svg.selectAll('line').remove();
    svg.selectAll('circle').remove();
    svg.selectAll('text').remove();
    svg.selectAll('rect').remove();
    svg.selectAll('image').remove();

    // Clear and recreate defs section for clip paths
    svg.selectAll('defs').remove();
    svg.append('defs');

    // Set up the SVG dimensions
    svg.attr('width', width).attr('height', height);

    // Create container group for zoom/pan
    const container = svg.append('g').attr('class', 'zoom-container');

    // Prepare data
    const nodes: D3Node[] = project.people.map((person) => {
      const savedPosition = savedNodePositions.get(person.id);
      return {
        id: person.id,
        person,
        // If we have saved positions, use them as initial positions
        ...(savedPosition && {
          x: savedPosition.x,
          y: savedPosition.y,
        }),
      };
    });

    // Create comprehensive links showing all family relationships
    const links: D3Link[] = [];
    const addedLinks = new Set<string>(); // Prevent duplicate links

    // Add all explicit relationships from the data
    project.relationships.forEach((rel) => {
      const linkKey = `${rel.fromId}-${rel.toId}`;
      const reverseLinkKey = `${rel.toId}-${rel.fromId}`;

      // For parent relationships, always show parent -> child direction
      if (
        rel.type === 'parent' ||
        rel.type === 'adoptive-parent' ||
        rel.type === 'step-parent'
      ) {
        if (!addedLinks.has(linkKey)) {
          links.push({
            source: rel.fromId, // Parent
            target: rel.toId, // Child
            type: rel.type,
          });
          addedLinks.add(linkKey);
        }
      }
      // For spouse/partner relationships, add bidirectional link (only once)
      else if (rel.type === 'spouse' || rel.type === 'partner') {
        if (!addedLinks.has(linkKey) && !addedLinks.has(reverseLinkKey)) {
          links.push({
            source: rel.fromId,
            target: rel.toId,
            type: rel.type,
          });
          addedLinks.add(linkKey);
          addedLinks.add(reverseLinkKey); // Mark both directions as added
        }
      }
      // For other relationships
      else if (!addedLinks.has(linkKey)) {
        links.push({
          source: rel.fromId,
          target: rel.toId,
          type: rel.type,
        });
        addedLinks.add(linkKey);
      }
    });

    setNodeCount(nodes.length);

    // Set up force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Create links (edges)
    const link = container
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        switch (d.type) {
          case 'spouse':
          case 'partner':
            return '#ff6b6b'; // Red for romantic relationships
          case 'parent':
          case 'adoptive-parent':
          case 'step-parent':
            return '#4dabf7'; // Blue for parent-child relationships
          default:
            return '#868e96'; // Gray for other relationships
        }
      })
      .attr('stroke-opacity', 0.9)
      .attr('stroke-width', (d) => {
        // Make romantic relationships slightly thicker, but still thin
        return d.type === 'spouse' || d.type === 'partner' ? 2 : 1.5;
      })
      .attr('stroke-dasharray', (d) => {
        // Use dashed lines for step relationships
        return d.type === 'step-parent' ? '5,5' : 'none';
      });

    // Create nodes
    const node = container
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d: D3Node) => {
        event.stopPropagation();
        onSelect?.(d.id);
      });

    // Add avatar circles or images
    node.each(function (d: D3Node) {
      const nodeElement = d3.select(this);
      const photoUrl = photoUrls.get(d.id);

      if (photoUrl) {
        // Add clipping path for circular image
        const clipId = `clip-${d.id}`;
        svg
          .append('defs')
          .append('clipPath')
          .attr('id', clipId)
          .append('circle')
          .attr('r', 18)
          .attr('cx', 0)
          .attr('cy', -15);

        // Add image
        nodeElement
          .append('image')
          .attr('x', -18)
          .attr('y', -33)
          .attr('width', 36)
          .attr('height', 36)
          .attr('href', photoUrl)
          .attr('clip-path', `url(#${clipId})`);

        // Add border circle
        const isSelected = d.id === selectedId;
        let strokeColor;
        if (isSelected) {
          strokeColor = '#ffd43b'; // Gold border when selected
        } else if (!d.person.alive || d.person.deathDate) {
          strokeColor = 'var(--mantine-color-gray-4)'; // Gray for deceased (matching tree view)
        } else {
          strokeColor = 'var(--mantine-color-green-5)'; // Green for living (matching tree view)
        }
        const strokeWidth = 3; // 3px to match tree view

        nodeElement
          .append('circle')
          .attr('r', 18)
          .attr('cy', -15)
          .attr('fill', 'none')
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);
      } else {
        // Fallback to circle with initial
        const isSelected = d.id === selectedId;
        let strokeColor;
        if (isSelected) {
          strokeColor = '#ffd43b'; // Gold border when selected
        } else if (!d.person.alive || d.person.deathDate) {
          strokeColor = 'var(--mantine-color-gray-4)'; // Gray for deceased (matching tree view)
        } else {
          strokeColor = 'var(--mantine-color-green-5)'; // Green for living (matching tree view)
        }
        const strokeWidth = 3; // 3px to match tree view

        nodeElement
          .append('circle')
          .attr('r', 18)
          .attr('cy', -15)
          .attr('fill', 'rgba(233, 236, 239, 0.9)')
          .attr('stroke', strokeColor)
          .attr('stroke-width', strokeWidth);

        // Add avatar text (first letter)
        nodeElement
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -10)
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('fill', '#495057')
          .style('pointer-events', 'none')
          .text(getFirstName(d.person.displayName).charAt(0).toUpperCase());
      }
    });

    // Add name text
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 15)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', (d: D3Node) => {
        if (!d.person.alive || d.person.deathDate) return '#6c757d';
        return '#212529';
      })
      .style('pointer-events', 'none')
      .text((d: D3Node) => {
        const firstName = getFirstName(d.person.displayName);
        return firstName.length > 10
          ? firstName.substring(0, 8) + '...'
          : firstName;
      })
      .append('title')
      .text((d: D3Node) => d.person.displayName); // Keep full name in tooltip

    // Add drag behavior
    const drag = d3
      .drag<SVGGElement, D3Node>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Save the position when user finishes dragging
        if (d.x !== undefined && d.y !== undefined) {
          savedNodePositions.set(d.id, { x: d.x, y: d.y });
        }
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    // Set up zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setZoomLevel(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoom);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: D3Node) => `translate(${d.x}, ${d.y})`);
    });

    // Add zoom controls functionality
    const zoomIn = () => {
      svg
        .transition()
        .duration(300)
        .call(zoom.scaleBy as any, 1.5);
    };

    const zoomOut = () => {
      svg
        .transition()
        .duration(300)
        .call(zoom.scaleBy as any, 1 / 1.5);
    };

    const resetView = () => {
      svg
        .transition()
        .duration(500)
        .call(zoom.transform as any, d3.zoomIdentity.translate(0, 0).scale(1));
    };

    const focusOnSelected = () => {
      if (selectedId) {
        const selectedNode = nodes.find((n) => n.id === selectedId);
        if (selectedNode?.x && selectedNode?.y) {
          // Create a new transform that first scales, then translates to center
          const scale = 1.5;
          const transform = d3.zoomIdentity
            .scale(scale)
            .translate(
              width / 2 / scale - selectedNode.x,
              height / 2 / scale - selectedNode.y
            );

          svg
            .transition()
            .duration(500)
            .call(zoom.transform as any, transform);
        }
      }
    };

    // Store functions for button access
    (svg.node() as any).__zoomIn = zoomIn;
    (svg.node() as any).__zoomOut = zoomOut;
    (svg.node() as any).__resetView = resetView;
    (svg.node() as any).__focusOnSelected = focusOnSelected;

    // Cleanup function
    return () => {
      // Save all current positions before unmounting
      nodes.forEach((node) => {
        if (node.x !== undefined && node.y !== undefined) {
          savedNodePositions.set(node.id, { x: node.x, y: node.y });
        }
      });
      simulation.stop();
      // No React roots to clean up since we're using pure SVG
    };
  }, [project, selectedId, onSelect, photoUrls, layoutKey]);

  // Auto-focus when selectedId changes (e.g., from other tabs)
  useEffect(() => {
    if (selectedId && svgRef.current) {
      const timer = setTimeout(() => {
        const svg = svgRef.current;
        if (svg && (svg as any).__focusOnSelected) {
          (svg as any).__focusOnSelected();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [selectedId]);

  const handleZoomIn = () => {
    const svg = svgRef.current;
    if (svg && (svg as any).__zoomIn) {
      (svg as any).__zoomIn();
    }
  };

  const handleZoomOut = () => {
    const svg = svgRef.current;
    if (svg && (svg as any).__zoomOut) {
      (svg as any).__zoomOut();
    }
  };

  const handleResetView = () => {
    const svg = svgRef.current;
    if (svg && (svg as any).__resetView) {
      (svg as any).__resetView();
    }
  };

  const handleFocusSelected = () => {
    const svg = svgRef.current;
    if (svg && (svg as any).__focusOnSelected) {
      (svg as any).__focusOnSelected();
    }
  };

  const handleResetLayout = () => {
    // Clear all saved positions to force natural layout
    savedNodePositions.clear();
    // Trigger re-render
    setLayoutKey((prev) => prev + 1);
  };

  if (!project || project.people.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <Text c='dimmed'>
          No family data to display. Add some people first!
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with controls - Compact */}
      <Group
        justify='space-between'
        mb='xs'
        style={{ padding: '8px 16px 0 16px', flexShrink: 0 }}
      >
        <div>
          <Text size='sm' c='dimmed'>
            {nodeCount} people • Zoom: {zoomLevel}x
            {selectedId &&
              ` • Selected: ${
                project.people.find((p) => p.id === selectedId)?.displayName
              }`}
          </Text>
        </div>

        <Group gap='xs'>
          <Tooltip label='Reset Layout'>
            <ActionIcon variant='light' onClick={handleResetLayout}>
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label='Reset View'>
            <ActionIcon variant='light' onClick={handleResetView}>
              <IconHome size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label='Zoom Out'>
            <ActionIcon variant='light' onClick={handleZoomOut}>
              <IconMinus size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label='Zoom In'>
            <ActionIcon variant='light' onClick={handleZoomIn}>
              <IconPlus size={16} />
            </ActionIcon>
          </Tooltip>
          {selectedId && (
            <>
              <Tooltip label='Focus on Selected'>
                <ActionIcon
                  variant='light'
                  color='blue'
                  onClick={handleFocusSelected}
                >
                  <IconFocus size={16} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label='Unselect'>
                <ActionIcon
                  variant='light'
                  color='red'
                  onClick={() => onSelect?.('')}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Group>
      </Group>

      {/* SVG Container - Takes remaining space */}
      <Box
        className={styles.graphContainer}
        style={{ flex: 1, margin: '0 8px', minHeight: 0 }}
      >
        <svg ref={svgRef} className={styles.svg} />
      </Box>

      {/* Instructions and Legend Combined - Compact */}
      <Group
        justify='space-between'
        align='flex-start'
        style={{ padding: '4px 16px 8px 16px', flexShrink: 0 }}
      >
        <Text size='xs' c='dimmed'>
          • Drag nodes to reposition • Scroll to zoom • Drag background to pan •
          Click nodes to select
        </Text>

        {/* Compact Legend */}
        <Group gap='lg'>
          <Group gap='xs'>
            <Text size='xs' fw={500} c='dimmed'>
              Lines:
            </Text>
            <Group gap='sm'>
              <Group gap={2}>
                <Box w={12} h={2} style={{ backgroundColor: '#ff6b6b' }} />
                <Text size='xs' c='dimmed'>
                  Romantic
                </Text>
              </Group>
              <Group gap={2}>
                <Box w={12} h={2} style={{ backgroundColor: '#4dabf7' }} />
                <Text size='xs' c='dimmed'>
                  Family
                </Text>
              </Group>
              <Group gap={2}>
                <Box
                  w={12}
                  h={2}
                  style={{
                    background:
                      'repeating-linear-gradient(to right, #868e96 0px, #868e96 2px, transparent 2px, transparent 4px)',
                  }}
                />
                <Text size='xs' c='dimmed'>
                  Step
                </Text>
              </Group>
            </Group>
          </Group>

          <Group gap='xs'>
            <Text size='xs' fw={500} c='dimmed'>
              People:
            </Text>
            <Group gap='sm'>
              <Group gap={2}>
                <Box
                  w={12}
                  h={12}
                  style={{
                    borderRadius: '50%',
                    border: '2px solid var(--mantine-color-green-5)',
                    backgroundColor: 'transparent',
                  }}
                />
                <Text size='xs' c='dimmed'>
                  Living
                </Text>
              </Group>
              <Group gap={2}>
                <Box
                  w={12}
                  h={12}
                  style={{
                    borderRadius: '50%',
                    border: '2px solid var(--mantine-color-gray-4)',
                    backgroundColor: 'transparent',
                  }}
                />
                <Text size='xs' c='dimmed'>
                  Deceased
                </Text>
              </Group>
              <Group gap={2}>
                <Box
                  w={12}
                  h={12}
                  style={{
                    borderRadius: '50%',
                    border: '2px solid #ffd43b',
                    backgroundColor: 'transparent',
                  }}
                />
                <Text size='xs' c='dimmed'>
                  Selected
                </Text>
              </Group>
            </Group>
          </Group>
        </Group>
      </Group>
    </div>
  );
}
