import React, { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Scope, Button, Switch } from '@Components/ui';
import { Select } from '@Components/ui/Select';
import OptionMenu from '@Components/OptionMenu';
import { API, namespace } from '@Utils/helper';
import { useDispatch } from 'react-redux';
import { showNotification } from '@Redux/Slices/notificationSlice/notificationSlice';
import SettingsSkeleton from '@Components/Loader/SettingsSkeleton';

import './styles.scss';

const PAYMENT_METHODS = [
	{ slug: 'paypal', label: 'PayPal' },
	{ slug: 'bank', label: 'Bank transfer' },
	{ slug: 'stripe', label: 'Stripe' },
];

const COMMISSION_TYPE_OPTIONS = [
	{ value: 'percent', label: __('Percent (%)', 'storeengine') },
	{ value: 'flat', label: __('Flat amount', 'storeengine') },
];

export default function MultiVendor({ onRegisterSave, onSavingChange, onDirtyChange }) {
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const saveRef = useRef(null);
	const [form, setForm] = useState({
		commission_rate: 10,
		commission_type: 'percent',
		auto_create_owner: false,
		owner_visible: false,
		min_withdraw_amount: 50,
		allow_vendor_signup: true,
		enabled_payment_methods: ['paypal', 'bank'],
		badges: [],
	});

	useEffect(() => {
		(async () => {
			try {
				const res = await API.get(
					`${namespace}multi-vendor/settings`
				);
				setForm((prev) => ({ ...prev, ...res.data }));
			} catch (e) {
				dispatch(
					showNotification({
						message: __(
							'Failed to load multi-vendor settings.',
							'storeengine'
						),
						type: 'error',
						isShow: true,
					})
				);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	// Every user edit funnels through set() (togglePayment / badge helpers all
	// call it), so signalling dirty here is enough to enable the TopBar Save
	// button. The initial GET uses setForm() directly, so loading data doesn't
	// mark the form dirty. Without this the parent's `hasTabChanges` never flips
	// and Save stays permanently disabled — the "settings not saved" bug.
	const set = (key, value) => {
		setForm((f) => ({ ...f, [key]: value }));
		onDirtyChange?.(true);
	};

	const togglePayment = (slug) => {
		const has = form.enabled_payment_methods.includes(slug);
		set(
			'enabled_payment_methods',
			has
				? form.enabled_payment_methods.filter((s) => s !== slug)
				: [...form.enabled_payment_methods, slug]
		);
	};

	const setBadgeField = (idx, key, value) => {
		const next = [...form.badges];
		next[idx] = { ...next[idx], [key]: value };
		set('badges', next);
	};

	const addBadge = () => {
		set('badges', [
			...form.badges,
			{ slug: '', label: '', color: '#64748b' },
		]);
	};

	const removeBadge = (idx) => {
		const next = [...form.badges];
		next.splice(idx, 1);
		set('badges', next);
	};

	const save = async () => {
		setSaving(true);
		onSavingChange?.(true);
		try {
			await API.post(`${namespace}multi-vendor/settings`, form);
			onDirtyChange?.(false);
			dispatch(
				showNotification({
					message: __('Settings saved.', 'storeengine'),
					type: 'success',
					isShow: true,
				})
			);
		} catch (e) {
			dispatch(
				showNotification({
					message:
						e?.response?.data?.message ??
						__('Save failed.', 'storeengine'),
					type: 'error',
					isShow: true,
				})
			);
		} finally {
			setSaving(false);
			onSavingChange?.(false);
		}
	};

	// Keep ref current so the stable wrapper registered below always calls the latest save.
	saveRef.current = save;

	useEffect(() => {
		onRegisterSave?.(() => saveRef.current?.());
		return () => onRegisterSave?.(null);
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	if (loading) {
		return <SettingsSkeleton />;
	}

	return (
		<Scope as="div" className="flex flex-col">
			<div className="storeengine-content-section">
				<h3 className='storeengine-heading'>{__('Commission', 'storeengine')}</h3>
				<div className="flex gap-4 w-full">
					<label className='flex flex-col gap-2 w-1/2'>
						<span className='storeengine-title'>{__('Default rate', 'storeengine')}</span>
						<input
							type="number"
							step="0.01"
							min="0"
							value={form.commission_rate}
							onChange={(e) =>
								set(
									'commission_rate',
									parseFloat(e.target.value)
								)
							}
							className='storeengine-input'
						/>
					</label>
					<label className='flex flex-col gap-2 w-1/2'>
						<span className='storeengine-title'>{__('Type', 'storeengine')}</span>
						<Select
							options={COMMISSION_TYPE_OPTIONS}
							value={
								COMMISSION_TYPE_OPTIONS.find(
									(o) => o.value === form.commission_type
								) ?? null
							}
							onChange={(option) =>
								set('commission_type', option?.value)
							}
						/>
					</label>
				</div>
			</div>

			<div className="storeengine-content-section">
				<h3 className='storeengine-heading'>{__('Vendor signup', 'storeengine')}</h3>
				<label className="flex items-center gap-2">
					<Switch
						checked={!!form.allow_vendor_signup}
						onChange={(next) =>
							set('allow_vendor_signup', next)
						}
					/>
					{__(
						'Allow public vendor signup via [storeengine_vendor_signup] shortcode',
						'storeengine'
					)}
				</label>
			</div>

			<div className="storeengine-content-section">
				<h3 className='storeengine-heading'>{__('Owner / default vendor', 'storeengine')}</h3>
				<div className='flex flex-col gap-4'>
					<label className="flex items-center gap-2">
						<Switch
							checked={!!form.auto_create_owner}
							onChange={(next) =>
								set('auto_create_owner', next)
							}
						/>
						{__(
							'Automatically create a vendor record for the site administrator',
							'storeengine'
						)}
					</label>
					<label className="flex items-center gap-2">
						<Switch
							checked={!!form.owner_visible}
							onChange={(next) =>
								set('owner_visible', next)
							}
						/>
						{__(
							'Show the owner vendor publicly (store page + shop archive filter)',
							'storeengine'
						)}
					</label>
				</div>
			</div>

			<div className="storeengine-content-section">
				<h3 className='storeengine-heading'>{__('Withdrawals', 'storeengine')}</h3>
				<div className='flex items-center justify-between gap-4'>
					<span className='storeengine-title'>{__('Minimum withdrawal amount', 'storeengine')}</span>
					<input
						type="number"
						step="0.01"
						min="0"
						value={form.min_withdraw_amount}
						onChange={(e) =>
							set(
								'min_withdraw_amount',
								parseFloat(e.target.value)
							)
						}
						className='storeengine-input w-40'
					/>
				</div>
				<div className="row mt-6 flex items-center gap-4 flex-wrap">
					{PAYMENT_METHODS.map((m) => (
						<label key={m.slug} className="flex items-center gap-2">
							<Switch
								checked={form.enabled_payment_methods.includes(
									m.slug
								)}
								onChange={() => togglePayment(m.slug)}
							/>
							<span className='mr-4'>
								{m.label}
							</span>
						</label>
					))}
				</div>
			</div>

			<div className="storeengine-content-section">
				<h3 className='storeengine-heading'>{__('Badges', 'storeengine')}</h3>
				<div className='bg-white rounded overflow-x-auto border border-solid border-se-border mb-6'>
					<table className="w-full m-0">
						<thead className='bg-[#F7F7F8] text-se-text uppercase tracking-wide'>
							<tr>
								<th className='capitalize text-left text-[14px] font-medium leading-5 p-3'>{__('Slug', 'storeengine')}</th>
								<th className='capitalize text-center text-[14px] font-medium leading-5 p-3'>{__('Label', 'storeengine')}</th>
								<th className='capitalize text-center text-[14px] font-medium leading-5 p-3'>{__('Color', 'storeengine')}</th>
								<th className='capitalize text-center text-[14px] font-medium leading-5 p-3'>{__('Action', 'storeengine')}</th>
							</tr>
						</thead>
						<tbody>
							{form.badges.map((b, idx) => (
								<tr key={idx}>
									<td className="text-left text-[14px] font-medium leading-5 p-3">
										<input
											type="text"
											value={b.slug}
											onChange={(e) =>
												setBadgeField(
													idx,
													'slug',
													e.target.value
												)
											}
											className='storeengine-input'
										/>
									</td>
									<td className="text-center text-[14px] font-medium leading-5 p-3">
										<input
											type="text"
											value={b.label}
											onChange={(e) =>
												setBadgeField(
													idx,
													'label',
													e.target.value
												)
											}
											className='storeengine-input'
										/>
									</td>
									<td className="text-center text-[14px] font-medium leading-5">
										<input
											type="color"
											value={b.color || '#64748b'}
											onChange={(e) =>
												setBadgeField(
													idx,
													'color',
													e.target.value
												)
											}
											className='storeengine-input w-[40px] h-[40px] mx-auto p-0 border-0 bg-transparent'
										/>
									</td>
									<td className="flex justify-center items-center p-3">
										<OptionMenu
											options={ [
												{
													type: 'button',
													label: <span>{ __( 'Remove', 'storeengine' ) }</span>,
													suffix: 'trash',
													icon: (
														<span
															className="storeengine-icon storeengine-icon--trash"
															aria-hidden="true"
														/>
													),
													onClick: () => removeBadge( idx ),
												},
											] }
											suffix="badge-row"
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<Button size="sm" onClick={addBadge}>
					{__('Add badge', 'storeengine')}
				</Button>
			</div>
		</Scope>
	);
}
