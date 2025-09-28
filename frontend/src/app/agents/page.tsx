"use client"
import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from 'next/image'
import Link from "next/link";
import { useRouter } from "next/navigation";
import './style.css'
import axios, { AxiosResponse } from "axios";
import { useAuth } from "@/hooks/useAuth";
import { Search } from "lucide-react";
import AgentPopupModal from "./components/agentModal";
import AgentStoreCard from "./components/agentStoreCard";

const CATEGORIES = [
    'productivity',
    'creativity',
    'business',
    'education',
    'technology',
    'marketing',
    'development',
    'content creation',
    'data analysis',
    'communication',
    'design',
    'image'
];

const PRICE_RANGES = [
    { label: 'All Prices', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Under 10 AUM', value: 'under-10' },
    { label: '10 AUM - 50 AUM', value: '10-50' },
    { label: '50 AUM - 100 AUM', value: '50-100' },
    { label: 'Over 100 AUM', value: 'over-100' }
];

// Type definitions
interface Agent {
    publish_id: string;
    category?: string;
    price?: number;
    // Add other agent properties as needed
    [key: string]: any;
}

interface ApiResponse {
    agents: Agent[];
    // Add other response properties if needed
    total?: number;
    hasMore?: boolean;
}

interface Filters {
    category: string;
    priceRange: string;
    search: string;
}

export default function AgentStore() {
    const { status, isAuthLoading } = useAuth()
    const [agentId, setAgentId] = useState(null)
    const [agents, setAgents] = useState<Agent[]>([]);
    const [page, setPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<Filters>({
        category: 'all',
        priceRange: 'all',
        search: ''
    });
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>('');
    const limit: number = 10;
    const observer = useRef<IntersectionObserver | null>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getAgents = useCallback(async (pageNum: number = 1, reset: boolean = false, currentFilters?: Filters): Promise<void> => {
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            const filtersToUse = currentFilters || filters;
            const params: any = {
                page: pageNum,
                limit,
            };

            // Add search filter
            if (filtersToUse.search.trim()) {
                params.search = filtersToUse.search.trim();
            }

            // Add category filter
            if (filtersToUse.category !== 'all') {
                params.category = filtersToUse.category;
            }

            // Add price range filter
            if (filtersToUse.priceRange !== 'all') {
                switch (filtersToUse.priceRange) {
                    case 'free':
                        params.price_min = 0;
                        params.price_max = 0;
                        break;
                    case 'under-10':
                        params.price_min = 0.01;
                        params.price_max = 9.99;
                        break;
                    case '10-50':
                        params.price_min = 10;
                        params.price_max = 50;
                        break;
                    case '50-100':
                        params.price_min = 50.01;
                        params.price_max = 100;
                        break;
                    case 'over-100':
                        params.price_min = 100.01;
                        break;
                }
            }

            const response: AxiosResponse<ApiResponse> = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URI}/v1/store/agents`,
                {
                    params,
                    withCredentials: true,
                }
            );

            const newAgents: Agent[] = response.data.agents || [];

            if (reset) {
                setAgents(newAgents);
            } else {
                setAgents(prev => [...prev, ...newAgents]);
            }

            // Check if we have more data
            setHasMore(newAgents.length === limit);

        } catch (e) {
            console.log(e);
            setError('Failed to load agents');
        } finally {
            setLoading(false);
        }
    }, [loading, limit, filters]);

    // Handle search input changes with debounce
    const handleSearchInputChange = useCallback((value: string) => {
        setSearchInput(value);

        // Clear existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set new timeout for debounced search
        searchTimeoutRef.current = setTimeout(() => {
            const updatedFilters = { ...filters, search: value };
            setFilters(updatedFilters);
            setPage(1);
            setAgents([]);
            setHasMore(true);
            getAgents(1, true, updatedFilters);
        }, 500); // 500ms delay
    }, [filters, getAgents]);

    // Clear search
    const clearSearch = useCallback(() => {
        setSearchInput('');
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        const updatedFilters = { ...filters, search: '' };
        setFilters(updatedFilters);
        setPage(1);
        setAgents([]);
        setHasMore(true);
        getAgents(1, true, updatedFilters);
    }, [filters, getAgents]);

    // Load initial data
    useEffect(() => {
        getAgents(1, true);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    // Handle filter changes
    const handleFilterChange = useCallback((newFilters: Partial<Filters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        setPage(1);
        setAgents([]);
        setHasMore(true);
        getAgents(1, true, updatedFilters);
    }, [filters, getAgents]);

    // Reset filters
    const resetFilters = useCallback(() => {
        const defaultFilters = { category: 'all', priceRange: 'all', search: '' };
        setFilters(defaultFilters);
        setSearchInput('');
        setPage(1);
        setAgents([]);
        setHasMore(true);
        getAgents(1, true, defaultFilters);

        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }, [getAgents]);

    // Intersection Observer callback
    const lastAgentElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => {
                    const nextPage = prevPage + 1;
                    getAgents(nextPage);
                    return nextPage;
                });
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore, getAgents]);
    console.log(agentId)

    return (
        <>
            {agentId && <AgentPopupModal agent_id={agentId} onClose={() => setAgentId(null)} />}
            <div className="agent-store">
                {/* Search Bar */}
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <span className="search-icon"><Search size={20} /></span>
                        <input
                            type="text"
                            placeholder="Search agents..."
                            value={searchInput}
                            onChange={(e) => handleSearchInputChange(e.target.value)}
                            className="search-input"
                        />
                        {searchInput && (
                            <button
                                onClick={clearSearch}
                                className="clear-search-btn"
                                aria-label="Clear search"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="filters-container">
                    <div className="filters-header">
                        <h3>AUM AGENTS</h3>
                        <button
                            className="toggle-filters-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <span>Filters</span>
                            <svg
                                className={`filter-icon ${showFilters ? 'rotate' : ''}`}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M6 9l6 6 6-6" />
                            </svg>
                        </button>

                        {(filters.category !== 'all' || filters.priceRange !== 'all' || filters.search) && (
                            <button
                                className="reset-filters-btn"
                                onClick={resetFilters}
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="filters-content">
                            {/* Category Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Category</label>
                                <select
                                    className="filter-select"
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange({ category: e.target.value })}
                                >
                                    <option value="all">All Categories</option>
                                    {CATEGORIES.map(category => (
                                        <option key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Price Range</label>
                                <select
                                    className="filter-select"
                                    value={filters.priceRange}
                                    onChange={(e) => handleFilterChange({ priceRange: e.target.value })}
                                >
                                    {PRICE_RANGES.map(range => (
                                        <option key={range.value} value={range.value}>
                                            {range.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Active Filters Display */}
                {(filters.category !== 'all' || filters.priceRange !== 'all' || filters.search) && (
                    <div className="active-filters">
                        <span className="active-filters-label">Active filters:</span>
                        {filters.search && (
                            <span className="filter-tag">
                                Search: "{filters.search}"
                                <button
                                    onClick={clearSearch}
                                    className="remove-filter-btn"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {filters.category !== 'all' && (
                            <span className="filter-tag">
                                Category: {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
                                <button
                                    onClick={() => handleFilterChange({ category: 'all' })}
                                    className="remove-filter-btn"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {filters.priceRange !== 'all' && (
                            <span className="filter-tag">
                                Price: {PRICE_RANGES.find(p => p.value === filters.priceRange)?.label}
                                <button
                                    onClick={() => handleFilterChange({ priceRange: 'all' })}
                                    className="remove-filter-btn"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </div>
                )}

                {/* Results Count */}
                {agents.length > 0 && (
                    <div className="results-count">
                        Showing {agents.length} agent{agents.length !== 1 ? 's' : ''}
                        {filters.search && ` for "${filters.search}"`}
                    </div>
                )}

                {/* Agents List */}
                {loading && <p>Loading...</p>}
                {agents.length > 0 && <div className="agents-store-grid">
                    {agents.map((agent: Agent, index: number) => {
                        // Attach ref to the last element
                        if (agents.length === index + 1) {
                            return (

                                <AgentStoreCard key={agent.publish_id + index} agentData={agent} ref={lastAgentElementRef} onClick={() => setAgentId(agent.agent.aid)} />

                            );
                        } else {
                            return <AgentStoreCard agentData={agent} key={agent.publish_id + index} onClick={() => setAgentId(agent.agent.aid)} />;
                        }
                    })}
                </div>}

                {/* Loading State */}
                {loading && (
                    <div className="loading-indicator">
                        {filters.search ? 'Searching...' : 'Loading more agents...'}
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="error-message">
                        {error}
                        <button
                            onClick={() => getAgents(page, false)}
                            className="retry-btn"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && agents.length === 0 && !error && (
                    <div className="empty-state">
                        {filters.search ? (
                            <p>No agents found for "{filters.search}".</p>
                        ) : (
                            <p>No agents found matching your criteria.</p>
                        )}
                        <button onClick={resetFilters} className="reset-btn">
                            Reset Filters
                        </button>
                    </div>
                )}

                {/* End of Results */}
                {!hasMore && agents.length > 0 && (
                    <div className="end-message">
                        You've reached the end!
                    </div>
                )}
            </div>
        </>
    );
}