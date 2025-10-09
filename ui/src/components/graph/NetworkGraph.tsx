import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { getDSL } from '@/lib/dsl';
import { useUser } from '@/lib/user-provider';
import { WriteTimeIndexer } from '@/../../src/app/indexer/write-time-indexer';
import { indexerStateToGraph } from '@/lib/indexer-to-graph';
import type { VisualizationData, VisualizationEvent } from '@/lib/indexer-to-graph';
import SocialGraph from './SocialGraph';
import MermaidGitGraphView from './MermaidGitGraphView';
import NodeDetailsView from './NodeDetailsView';
import Legend from './Legend';
import type { KeritsDSL } from '@/../../src/app/dsl/types';

export function NetworkGraph() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useUser();
  const selectedId = searchParams.get('id');
  const viewType = searchParams.get('view') || 'history';

  const [graphData, setGraphData] = useState<VisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dsl, setDsl] = useState<KeritsDSL | null>(null);
  const [filter, setFilter] = useState('');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Initialize selectedNode from URL on mount
  useEffect(() => {
    if (selectedId) {
      setSelectedNode(selectedId);
    }
  }, [selectedId]);

  // Update URL when selectedNode changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (selectedNode) {
      params.set('id', selectedNode);
    } else {
      params.delete('id');
    }
    if (viewType) {
      params.set('view', viewType);
    }
    setSearchParams(params, { replace: true });
  }, [selectedNode, viewType]);

  // Load indexer state on mount
  useEffect(() => {
    async function loadIndexerState() {
      try {
        setLoading(true);
        setError(null);

        const dslInstance = await getDSL(currentUser?.id);
        setDsl(dslInstance);

        // Get the store and create indexer
        const store = dslInstance.getStore();
        const indexer = WriteTimeIndexer.withStore(store);

        // Export indexer state
        const indexerState = await indexer.exportState();

        // Convert to visualization format
        const vizData = indexerStateToGraph(indexerState);
        setGraphData(vizData);
      } catch (err) {
        console.error('Failed to load indexer state:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    loadIndexerState();
  }, [currentUser]);

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNode(nodeId);
  };

  const handleNodeHover = (nodeId: string | null) => {
    setHoveredNode(nodeId);
  };

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('view', value);
    if (selectedNode) {
      params.set('id', selectedNode);
    }
    setSearchParams(params);
  };

  // Find the selected/hovered node in the data
  const displayNodeId = selectedNode || hoveredNode;
  const displayNode: VisualizationEvent | null = displayNodeId && graphData
    ? graphData.identities
      .flatMap(id => id.events || [])
      .find(e => e.id === displayNodeId) || null
    : null;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            Loading graph data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-red-500">
            Error loading graph: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.identities.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            No data found - create an identity to view the network graph
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Network Graph</CardTitle>
          <CardDescription>
            Visualize KERI event chains and relationships across identities
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={viewType} onValueChange={handleViewChange} className="w-full">
        <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-0">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Main Graph Panel */}
            <Card className="flex-1 min-w-0">
              <CardContent className="p-0">
                <div className="flex flex-col h-[calc(100vh-300px)]">
                  <Legend filter={filter} onFilterChange={setFilter} />
                  <div className="flex-1 overflow-auto">
                    <SocialGraph
                      data={graphData}
                      filter={filter}
                      selectedNode={selectedNode}
                      hoveredNode={hoveredNode}
                      onNodeSelect={handleNodeSelect}
                      onNodeHover={handleNodeHover}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Node Details Panel */}
            <Card className="xl:w-96 xl:flex-shrink-0">
              <CardContent className="p-0 h-[calc(100vh-300px)] overflow-auto">
                <NodeDetailsView
                  node={displayNode}
                  allData={graphData}
                  isPinned={!!selectedNode}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="graph" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Git-Style Graph View</CardTitle>
              <CardDescription>
                KERI event chains visualized as git-style commit graphs
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[600px]">
              <MermaidGitGraphView data={graphData} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
