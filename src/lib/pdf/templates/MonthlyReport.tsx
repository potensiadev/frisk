import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Font,
} from '@react-pdf/renderer';

// Register Korean font (using Noto Sans KR from Google Fonts CDN would require download)
// For now, we'll use built-in fonts which may have limited Korean support

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 2,
        borderBottomColor: '#3b82f6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 12,
        color: '#6b7280',
    },
    disclaimer: {
        fontSize: 9,
        color: '#9ca3af',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#f3f4f6',
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryCard: {
        width: '30%',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    summaryUnit: {
        fontSize: 10,
        color: '#6b7280',
    },
    table: {
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 4,
    },
    tableHeaderCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
    },
    tableCell: {
        fontSize: 9,
        color: '#4b5563',
    },
    colName: { width: '25%' },
    colStudentNo: { width: '20%' },
    colDepartment: { width: '25%' },
    colAbsences: { width: '15%' },
    colReason: { width: '15%' },
    reasonBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
    },
    reasonItem: {
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        width: '30%',
    },
    reasonLabel: {
        fontSize: 10,
        color: '#6b7280',
        marginBottom: 4,
    },
    reasonValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    riskBadge: {
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        padding: 2,
        borderRadius: 2,
        fontSize: 8,
    },
    noData: {
        fontSize: 11,
        color: '#9ca3af',
        textAlign: 'center',
        padding: 20,
    },
});

export interface ReportData {
    universityName: string;
    reportMonth: string;
    reportYear: number;
    generatedAt: string;
    summary: {
        totalStudents: number;
        absenceCount: number;
        absenceRate: number;
    };
    reasonBreakdown: {
        illness: number;
        personal: number;
        other: number;
    };
    riskStudents: Array<{
        name: string;
        studentNo: string;
        department: string;
        absenceCount: number;
    }>;
    monthlyAbsences: Array<{
        name: string;
        studentNo: string;
        department: string;
        absenceDate: string;
        reason: string;
    }>;
}

interface MonthlyReportProps {
    data: ReportData;
}

const reasonLabels: Record<string, string> = {
    illness: 'Illness',
    personal: 'Personal',
    other: 'Other',
};

export function MonthlyReport({ data }: MonthlyReportProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Monthly Attendance Report</Text>
                    <Text style={styles.subtitle}>
                        {data.universityName} - {data.reportYear}년 {data.reportMonth}
                    </Text>
                    <Text style={styles.disclaimer}>
                        ※ This report is prepared for student management record purposes by FRISK ERP System.
                    </Text>
                </View>

                {/* Summary Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Summary</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Total Students</Text>
                            <Text style={styles.summaryValue}>
                                {data.summary.totalStudents}
                                <Text style={styles.summaryUnit}> students</Text>
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Absences This Month</Text>
                            <Text style={styles.summaryValue}>
                                {data.summary.absenceCount}
                                <Text style={styles.summaryUnit}> cases</Text>
                            </Text>
                        </View>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Absence Rate</Text>
                            <Text style={styles.summaryValue}>
                                {data.summary.absenceRate.toFixed(1)}
                                <Text style={styles.summaryUnit}>%</Text>
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Reason Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Absence by Reason</Text>
                    <View style={styles.reasonBreakdown}>
                        <View style={styles.reasonItem}>
                            <Text style={styles.reasonLabel}>Illness</Text>
                            <Text style={styles.reasonValue}>{data.reasonBreakdown.illness}</Text>
                        </View>
                        <View style={styles.reasonItem}>
                            <Text style={styles.reasonLabel}>Personal</Text>
                            <Text style={styles.reasonValue}>{data.reasonBreakdown.personal}</Text>
                        </View>
                        <View style={styles.reasonItem}>
                            <Text style={styles.reasonLabel}>Other</Text>
                            <Text style={styles.reasonValue}>{data.reasonBreakdown.other}</Text>
                        </View>
                    </View>
                </View>

                {/* Risk Students (3+ absences) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Risk Students (3+ Absences)</Text>
                    {data.riskStudents.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colName]}>Name</Text>
                                <Text style={[styles.tableHeaderCell, styles.colStudentNo]}>Student No.</Text>
                                <Text style={[styles.tableHeaderCell, styles.colDepartment]}>Department</Text>
                                <Text style={[styles.tableHeaderCell, styles.colAbsences]}>Absences</Text>
                            </View>
                            {data.riskStudents.map((student, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colName]}>{student.name}</Text>
                                    <Text style={[styles.tableCell, styles.colStudentNo]}>{student.studentNo}</Text>
                                    <Text style={[styles.tableCell, styles.colDepartment]}>{student.department}</Text>
                                    <Text style={[styles.tableCell, styles.colAbsences]}>
                                        <Text style={styles.riskBadge}>{student.absenceCount}</Text>
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noData}>No risk students this month</Text>
                    )}
                </View>

                {/* Monthly Absence List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Absence Details</Text>
                    {data.monthlyAbsences.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, styles.colName]}>Name</Text>
                                <Text style={[styles.tableHeaderCell, styles.colStudentNo]}>Student No.</Text>
                                <Text style={[styles.tableHeaderCell, styles.colDepartment]}>Date</Text>
                                <Text style={[styles.tableHeaderCell, styles.colReason]}>Reason</Text>
                            </View>
                            {data.monthlyAbsences.slice(0, 20).map((absence, index) => (
                                <View key={index} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.colName]}>{absence.name}</Text>
                                    <Text style={[styles.tableCell, styles.colStudentNo]}>{absence.studentNo}</Text>
                                    <Text style={[styles.tableCell, styles.colDepartment]}>{absence.absenceDate}</Text>
                                    <Text style={[styles.tableCell, styles.colReason]}>
                                        {reasonLabels[absence.reason] || absence.reason}
                                    </Text>
                                </View>
                            ))}
                            {data.monthlyAbsences.length > 20 && (
                                <Text style={[styles.noData, { fontSize: 9 }]}>
                                    ... and {data.monthlyAbsences.length - 20} more
                                </Text>
                            )}
                        </View>
                    ) : (
                        <Text style={styles.noData}>No absences recorded this month</Text>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated: {data.generatedAt} | FRISK - Foreign Student Risk Management ERP
                </Text>
            </Page>
        </Document>
    );
}
